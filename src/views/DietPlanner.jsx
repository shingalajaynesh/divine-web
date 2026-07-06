import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Card, Row, Col, Typography, Select, Input, Checkbox, Button, Divider, Space, Tag, List } from 'antd';
import { 
  HeartOutlined, CheckCircleOutlined, PlusOutlined, 
  DeleteOutlined, SmileOutlined, ShoppingCartOutlined 
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_DIET_PREFERENCE_QUERY, GET_MY_MEAL_PLANS_QUERY, GET_SHOPPING_LIST_QUERY,
  UPDATE_DIET_PREFERENCE_MUTATION, TOGGLE_MEAL_PLAN_MUTATION, 
  ADD_SHOPPING_ITEM_MUTATION, TOGGLE_SHOPPING_ITEM_MUTATION, CLEAR_PURCHASED_SHOPPING_LIST_MUTATION 
} from '../graphql/operations';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const PRESET_ALLERGENS = ['Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish', 'Wheat', 'Peanuts'];

export default function DietPlanner({ user }) {
  const userLang = user?.language || 'en';
  const isHi = userLang === 'hi';
  const currentDay = user?.pregnancyDay || 1;

  // GraphQL Queries
  const { data: prefData, refetch: refetchPref } = useQuery(GET_DIET_PREFERENCE_QUERY);
  const { data: mealData, refetch: refetchMeals } = useQuery(GET_MY_MEAL_PLANS_QUERY, {
    variables: { dayNumber: currentDay }
  });
  const { data: shoppingData, refetch: refetchShopping } = useQuery(GET_SHOPPING_LIST_QUERY);

  // GraphQL Mutations
  const [updatePref] = useMutation(UPDATE_DIET_PREFERENCE_MUTATION);
  const [toggleMeal] = useMutation(TOGGLE_MEAL_PLAN_MUTATION);
  const [addShopping] = useMutation(ADD_SHOPPING_ITEM_MUTATION);
  const [toggleShopping] = useMutation(TOGGLE_SHOPPING_ITEM_MUTATION);
  const [clearPurchased] = useMutation(CLEAR_PURCHASED_SHOPPING_LIST_MUTATION);

  // Local state for edits
  const [dietType, setDietType] = useState('VEG');
  const [allergens, setAllergens] = useState([]);
  const [notes, setNotes] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [newQty, setNewQty] = useState('');

  // Sync preference data to state on load
  useEffect(() => {
    if (prefData?.getDietPreference) {
      const p = prefData.getDietPreference;
      setDietType(p.dietType);
      setNotes(p.notes || '');
      try {
        setAllergens(JSON.parse(p.allergens || '[]'));
      } catch (e) {
        setAllergens([]);
      }
    }
  }, [prefData]);

  const handleSavePreferences = async () => {
    try {
      await updatePref({
        variables: { input: { dietType, allergens, notes } }
      });
      toast.success(isHi ? "आहार प्राथमिकताएं सहेजी गईं" : "Diet preferences updated successfully");
      refetchPref();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleToggleMeal = async (mealPlanId, completed) => {
    try {
      await toggleMeal({
        variables: { mealPlanId, completed }
      });
      refetchMeals();
      toast.success(completed ? (isHi ? "भोजन पूरा हुआ" : "Meal marked complete!") : (isHi ? "भोजन हटाया गया" : "Meal unchecked"));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleAddShopping = async () => {
    if (!newIngredient.trim()) return;
    try {
      await addShopping({
        variables: { input: { ingredientName: newIngredient.trim(), quantity: newQty.trim() } }
      });
      setNewIngredient('');
      setNewQty('');
      refetchShopping();
      toast.success(isHi ? "सामग्री जोड़ी गई" : "Ingredient added");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleToggleShopping = async (itemId, purchased) => {
    try {
      await toggleShopping({ variables: { itemId, purchased } });
      refetchShopping();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleClearPurchased = async () => {
    try {
      await clearPurchased();
      refetchShopping();
      toast.success(isHi ? "खरीदी गई सामग्री सूची साफ की गई" : "Purchased items cleared");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxHeight: '100%', overflowY: 'auto' }}>
      <section style={{ marginBottom: '24px' }}>
        <Tag color="green">NUTRITION HUB</Tag>
        <Title level={2} style={{ marginTop: '8px' }}>
          {isHi ? "गर्भ संस्कार पोषण और भोजन योजना" : "Divine Nutrition & Meal Planner"}
        </Title>
        <Paragraph type="secondary">
          {isHi 
            ? "स्वस्थ गर्भावस्था के लिए संतुलित सात्विक भोजन योजना, पोषण प्राथमिकताएं और खरीदारी सूची।" 
            : "Balanced Sattvik meal logs, pregnancy nutrition choices, and custom grocery shopping list tracking."
          }
        </Paragraph>
      </section>

      <Row gutter={[24, 24]}>
        {/* Column 1: Preferences & Safety */}
        <Col xs={24} lg={10}>
          <Card 
            title={<span><HeartOutlined /> {isHi ? "आहार प्राथमिकताएं और एलर्जी" : "Dietary Profile & Allergens"}</span>}
            style={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>{isHi ? "आहार प्रकार" : "Diet Type"}</Text>
                <Select value={dietType} onChange={setDietType} style={{ width: '100%' }}>
                  <Option value="VEG">{isHi ? "शाकाहारी (Veg)" : "Vegetarian (Veg)"}</Option>
                  <Option value="VEGAN">{isHi ? "शाकाहारी वीगन (Vegan)" : "Vegan"}</Option>
                  <Option value="EGGITARIAN">{isHi ? "अंडाहारी (Eggitarian)" : "Eggitarian"}</Option>
                  <Option value="NON_VEG">{isHi ? "मांसाहारी (Non-Veg)" : "Non-Vegetarian (Non-Veg)"}</Option>
                </Select>
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>{isHi ? "एलर्जी / खाद्य संवेदनशीलता" : "Allergens / Food Sensitivities"}</Text>
                <Select 
                  mode="multiple" 
                  placeholder={isHi ? "एलर्जी चुनें..." : "Select allergens..."} 
                  value={allergens} 
                  onChange={setAllergens} 
                  style={{ width: '100%' }}
                >
                  {PRESET_ALLERGENS.map(a => <Option key={a} value={a.toLowerCase()}>{a}</Option>)}
                </Select>
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>{isHi ? "अतिरिक्त पोषण नोट्स" : "Obstetric Nutrition Notes"}</Text>
                <Input.TextArea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder={isHi ? "जैसे: चाय/कॉफी कम लें, नारियल पानी नियमित पियें..." : "e.g., Prefers high-iron foods, avoiding raw sprouts..."}
                  rows={3} 
                />
              </div>

              <Button type="primary" onClick={handleSavePreferences} block style={{ background: '#0f766e', borderColor: '#0f766e', marginTop: '8px' }}>
                {isHi ? "आहार प्रोफाइल सहेजें" : "Save Dietary Profile"}
              </Button>
            </div>
          </Card>
        </Col>

        {/* Column 2: Daily Meal Checklist */}
        <Col xs={24} lg={14}>
          <Card 
            title={<span>📅 {isHi ? `दिवस ${currentDay} भोजन योजना` : `Day ${currentDay} Meal Checklist`}</span>}
            style={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(mealData?.getMyMealPlans || []).map((meal) => (
                <div 
                  key={meal.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 16px', 
                    backgroundColor: meal.completed ? '#f0fdf4' : '#f8fafc', 
                    borderRadius: '12px',
                    border: `1px solid ${meal.completed ? '#bcf0da' : '#e2e8f0'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <Tag color={meal.completed ? "green" : "blue"} style={{ fontWeight: 'bold' }}>{meal.mealType}</Tag>
                    <Text strong style={{ fontSize: '14px', marginLeft: '8px', textDecoration: meal.completed ? 'line-through' : 'none', color: meal.completed ? '#94a3b8' : '#1e293b' }}>
                      {meal.customMealName || (
                        meal.mealType === 'BREAKFAST' ? (isHi ? "पौष्टिक दलिया और बादाम" : "Iron-rich Oatmeal & Almonds")
                        : meal.mealType === 'LUNCH' ? (isHi ? "हरी सब्जी, दाल और रोटी" : "Green Spinach Sabji, Dal & Roti")
                        : meal.mealType === 'SNACK' ? (isHi ? "मखाना खीर या नारियल पानी" : "Roasted Makhana & Coconut Water")
                        : (isHi ? "हल्की मूंग दाल खिचड़ी" : "Light Moong Dal Khichdi")
                      )}
                    </Text>
                  </div>
                  <Checkbox 
                    checked={meal.completed} 
                    onChange={e => handleToggleMeal(meal.id, e.target.checked)} 
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '32px 0' }} />

      {/* Shopping List Section */}
      <Card 
        title={<span><ShoppingCartOutlined /> {isHi ? "सामग्री की खरीदारी सूची" : "Nutrition Grocery Shopping List"}</span>}
        extra={<Button type="text" danger onClick={handleClearPurchased}>{isHi ? "खरीदी गई साफ करें" : "Clear Purchased"}</Button>}
        style={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={10}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text strong>{isHi ? "सामग्री जोड़ें" : "Quick Add Ingredient"}</Text>
              <Input 
                placeholder={isHi ? "जैसे: बादाम, पालक..." : "e.g., Organic Spinach, Chia seeds..."} 
                value={newIngredient} 
                onChange={e => setNewIngredient(e.target.value)} 
              />
              <Input 
                placeholder={isHi ? "मात्रा (जैसे: 250 ग्राम)" : "Quantity (e.g., 250g)"} 
                value={newQty} 
                onChange={e => setNewQty(e.target.value)} 
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddShopping} block style={{ background: '#0f766e', borderColor: '#0f766e' }}>
                {isHi ? "सूची में जोड़ें" : "Add to List"}
              </Button>
            </div>
          </Col>
          <Col xs={24} md={14}>
            <List
              dataSource={shoppingData?.getShoppingList || []}
              renderItem={item => (
                <List.Item 
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    marginBottom: '6px', 
                    background: item.purchased ? '#f8fafc' : '#ffffff', 
                    border: '1px solid #f1f5f9' 
                  }}
                >
                  <Checkbox 
                    checked={item.purchased} 
                    onChange={e => handleToggleShopping(item.id, e.target.checked)}
                  >
                    <span style={{ textDecoration: item.purchased ? 'line-through' : 'none', color: item.purchased ? '#94a3b8' : '#1e293b' }}>
                      {item.ingredientName} {item.quantity ? `(${item.quantity})` : ''}
                    </span>
                  </Checkbox>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
