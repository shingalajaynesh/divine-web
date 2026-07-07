import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Modal, Button, Radio, Space, Divider, Typography, Tag, Select, Checkbox, Tooltip } from 'antd';
import { 
  FontSizeOutlined, BgColorsOutlined, TranslationOutlined, 
  SoundOutlined, CopyOutlined, StarOutlined, StarFilled,
  LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined,
  DownloadOutlined, FilePdfOutlined
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { SET_CONTENT_BOOKMARK_MUTATION } from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;

export default function ReadingModeModal({ 
  visible, 
  onClose, 
  contentItemId,
  title, 
  body, 
  translations = [], 
  lang = 'en',
  isInitiallyBookmarked = false,
  isPdf = false 
}) {
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('reader_font_size') || '18'));
  const [theme, setTheme] = useState(() => localStorage.getItem('reader_theme') || 'sepia');
  
  // Translation selection states
  const [primaryLang, setPrimaryLang] = useState(lang);
  const [showBilingual, setShowBilingual] = useState(false);
  const [secondaryLang, setSecondaryLang] = useState('hi');
  
  // TTS State
  const [speaking, setSpeaking] = useState(false);
  
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(isInitiallyBookmarked);
  const [setBookmark, { loading: togglingBookmark }] = useMutation(SET_CONTENT_BOOKMARK_MUTATION);

  // PDF simulator states
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);
  const totalPdfPages = 5;

  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  useEffect(() => {
    setIsBookmarked(isInitiallyBookmarked);
  }, [isInitiallyBookmarked, visible]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Update primary/secondary language when modal opens
  useEffect(() => {
    if (visible) {
      setPrimaryLang(lang);
      // Auto pick a secondary language that is different
      const other = translations?.find(t => t.language !== lang);
      if (other) {
        setSecondaryLang(other.language);
      }
    }
  }, [visible, lang, translations]);

  // Find actual translation texts matching selections
  const primaryText = React.useMemo(() => {
    const found = translations?.find(t => t.language === primaryLang);
    return found || { title: title, body: body };
  }, [translations, primaryLang, title, body]);

  const secondaryText = React.useMemo(() => {
    return translations?.find(t => t.language === secondaryLang) || null;
  }, [translations, secondaryLang]);

  const handleCopy = () => {
    const textToCopy = `${primaryText.title}\n\n${primaryText.body}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success(primaryLang === 'hi' ? "टेक्स्ट कॉपी किया गया" : "Content copied to clipboard");
  };

  const handleToggleBookmark = async () => {
    if (!contentItemId) return;
    try {
      const nextSaved = !isBookmarked;
      await setBookmark({
        variables: {
          input: {
            contentItemId,
            kind: 'bookmark',
            saved: nextSaved
          }
        }
      });
      setIsBookmarked(nextSaved);
      toast.success(
        nextSaved 
          ? (primaryLang === 'hi' ? 'बुकमार्क में सहेजा गया' : 'Added to Bookmarks')
          : (primaryLang === 'hi' ? 'बुकमार्क से हटाया गया' : 'Removed from Bookmarks')
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleSpeech = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      const textToRead = primaryText.body || '';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = primaryLang === 'hi' ? 'hi-IN' : (primaryLang === 'gu' ? 'gu-IN' : 'en-US');
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      setSpeaking(true);
      window.speechSynthesis?.speak(utterance);
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'sepia':
        return {
          bg: '#f4ecd8',
          text: '#433422',
          border: '#e6dfcf',
          heading: '#2c1e11'
        };
      case 'dark':
        return {
          bg: '#0f172a',
          text: '#cbd5e1',
          border: '#334155',
          heading: '#f8fafc'
        };
      case 'light':
      default:
        return {
          bg: '#ffffff',
          text: '#1e293b',
          border: '#f1f5f9',
          heading: '#0f172a'
        };
    }
  };

  const s = getThemeStyles();

  // Simulating mock text content inside pages of PDF
  const mockPdfPagesContent = [
    {
      header: "CHAPTER 1: INTRODUCTION TO SWADHYAYA",
      paragraphs: [
        "Swadhyaya is the practice of self-study and deep introspection. During pregnancy, this helps the mother connect with the growing baby inside her womb, building a strong spiritual and mental bond before birth.",
        "Take a comfortable seated posture, close your eyes, and direct your breath down into the pelvic floor. Imagine a warm, golden sphere of light surrounding your baby."
      ]
    },
    {
      header: "CHAPTER 2: BREATHING & RHYTHMS",
      paragraphs: [
        "Pranayama forms the bridge between physical actions and cognitive stillness. Gentle Ujjayi breathing can help regulate blood pressure and increase blood oxygenation levels in the placenta.",
        "Breathe in for four seconds, hold for two seconds, and exhale completely for six seconds. Repeat ten times."
      ]
    },
    {
      header: "CHAPTER 3: CONNECTING WITH COGNITION",
      paragraphs: [
        "A pregnant mother's cognitive and psychological states directly affect fetal neurological growth. Swadhyaya readings of sacred texts nourish positive thoughts.",
        "Avoid reading negative news or stress-inducing literature during the late trimesters."
      ]
    },
    {
      header: "CHAPTER 4: BALANCED DIET & RECIPES",
      paragraphs: [
        "A healthy diet is essential for physical energy and mental focus. Take rich iron and calcium snacks like roasted foxnuts (makhana), sesame seed bars, and fresh fruit bowls.",
        "Ensure drinking at least three liters of clean water daily."
      ]
    },
    {
      header: "CHAPTER 5: CONCLUSION & DAILY CHECKLIST",
      paragraphs: [
        "Integrate 15 minutes of quiet readings into your evening routines. Maintain your daily quotients, take active rest, and sleep peacefully.",
        "Happy pregnancy journey!"
      ]
    }
  ];

  return (
    <Modal
      open={visible}
      onCancel={() => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        onClose();
      }}
      footer={null}
      width={720}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '95%' }}>
          <Space size={8}>
            {isPdf ? <FilePdfOutlined style={{ color: '#be123c' }} /> : <TranslationOutlined style={{ color: '#be123c' }} />}
            <span>{isPdf ? (primaryLang === 'hi' ? "ई-बुक / पीडीएफ रीडर" : "E-Book / PDF Reader") : (primaryLang === 'hi' ? "रीडिंग मोड" : "Reader Mode")}</span>
          </Space>
          {contentItemId && (
            <Button 
              shape="circle" 
              type="text" 
              loading={togglingBookmark}
              icon={isBookmarked ? <StarFilled style={{ color: '#f59e0b', fontSize: '18px' }} /> : <StarOutlined style={{ fontSize: '18px' }} />} 
              onClick={handleToggleBookmark} 
            />
          )}
        </div>
      }
      destroyOnClose
      style={{ borderRadius: '24px', overflow: 'hidden' }}
    >
      {/* Reader Settings & Controls Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
        
        {/* Font scaling - Hide for PDF as zoom handles it */}
        {!isPdf && (
          <Space>
            <FontSizeOutlined style={{ color: '#64748b' }} />
            <Radio.Group size="small" value={fontSize} onChange={e => setFontSize(e.target.value)}>
              <Radio.Button value={14}>A-</Radio.Button>
              <Radio.Button value={18}>A</Radio.Button>
              <Radio.Button value={22}>A+</Radio.Button>
              <Radio.Button value={26}>A++</Radio.Button>
            </Radio.Group>
          </Space>
        )}

        {/* Zoom controls for PDF */}
        {isPdf && (
          <Space>
            <Tooltip title="Zoom Out"><Button size="small" icon={<ZoomOutOutlined />} onClick={() => setPdfZoom(z => Math.max(z - 10, 80))} /></Tooltip>
            <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>{pdfZoom}%</Text>
            <Tooltip title="Zoom In"><Button size="small" icon={<ZoomInOutlined />} onClick={() => setPdfZoom(z => Math.min(z + 10, 150))} /></Tooltip>
          </Space>
        )}

        <Space>
          <BgColorsOutlined style={{ color: '#64748b' }} />
          <Radio.Group size="small" value={theme} onChange={e => setTheme(e.target.value)}>
            <Radio.Button value="light">{primaryLang === 'hi' ? "उजाला" : "Light"}</Radio.Button>
            <Radio.Button value="sepia">{primaryLang === 'hi' ? "सेपिया" : "Sepia"}</Radio.Button>
            <Radio.Button value="dark">{primaryLang === 'hi' ? "डार्क" : "Dark"}</Radio.Button>
          </Radio.Group>
        </Space>

        <Space>
          {/* TTS Speech Trigger */}
          <Button 
            size="small" 
            type={speaking ? 'primary' : 'default'} 
            danger={speaking}
            icon={<SoundOutlined />} 
            onClick={toggleSpeech}
            style={speaking ? { background: '#be123c', borderColor: '#be123c' } : {}}
            disabled={isPdf} // Disable for PDF pages
          >
            {speaking ? (primaryLang === 'hi' ? "रोकें" : "Stop") : (primaryLang === 'hi' ? "सुने" : "Listen")}
          </Button>

          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={isPdf} />
          
          {isPdf && (
            <Button size="small" icon={<DownloadOutlined />} href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank" download>
              PDF
            </Button>
          )}
        </Space>
      </div>

      {/* Multilingual Selector (Primary & Bilingual side-by-side dropdown selectors) */}
      {!isPdf && translations && translations.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#f1f5f9', padding: '10px 16px', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', marginRight: '6px', fontWeight: 'bold' }}>Primary Language:</span>
            <Select 
              value={primaryLang} 
              onChange={setPrimaryLang} 
              style={{ width: '110px' }}
              options={translations.map(t => ({ value: t.language, label: t.language.toUpperCase() }))}
            />
          </div>

          <Checkbox checked={showBilingual} onChange={e => setShowBilingual(e.target.checked)}>
            Compare Side-by-Side (Bilingual)
          </Checkbox>

          {showBilingual && (
            <div>
              <span style={{ fontSize: '12px', marginRight: '6px', fontWeight: 'bold' }}>Compare with:</span>
              <Select 
                value={secondaryLang} 
                onChange={setSecondaryLang} 
                style={{ width: '110px' }}
                options={translations
                  .filter(t => t.language !== primaryLang)
                  .map(t => ({ value: t.language, label: t.language.toUpperCase() }))
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Reader Layout Container */}
      <div 
        style={{
          backgroundColor: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: '20px',
          padding: isPdf ? '20px' : '24px 32px',
          maxHeight: '450px',
          overflowY: 'auto',
          transition: 'all 0.2s ease-in-out',
          userSelect: isPdf ? 'none' : 'text'
        }}
      >
        {isPdf ? (
          // Simulated PDF Layout Page
          <div style={{ 
            background: '#ffffff', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '40px',
            margin: '0 auto',
            maxWidth: '90%',
            transform: `scale(${pdfZoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.1s ease',
            color: '#1e293b'
          }}>
            <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
              <span>{primaryText.title}</span>
              <span>PAGE {pdfPage}</span>
            </div>

            <Title level={4} style={{ fontFamily: 'Georgia, serif', color: '#be123c', marginBottom: '20px', textAlign: 'center' }}>
              {mockPdfPagesContent[pdfPage - 1]?.header}
            </Title>

            {mockPdfPagesContent[pdfPage - 1]?.paragraphs?.map((p, index) => (
              <Paragraph key={index} style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', textIndent: '24px', marginBottom: '16px' }}>
                {p}
              </Paragraph>
            ))}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
              © The Divine Garbh Sanskar Hub · Academic E-Book Library
            </div>
          </div>
        ) : (
          // Standard / Bilingual Article text layout
          <div>
            <Title level={3} style={{ color: s.heading, marginBottom: '20px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
              {primaryText.title}
            </Title>

            {showBilingual && secondaryText ? (
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Tag color="volcano" style={{ marginBottom: '8px' }}>{primaryLang.toUpperCase()}</Tag>
                  <Paragraph 
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.8',
                      color: s.text,
                      fontFamily: 'Georgia, serif',
                      textAlign: 'justify'
                    }}
                  >
                    {primaryText.body}
                  </Paragraph>
                </Col>
                <Col xs={24} md={12} style={{ borderLeft: `1px solid ${s.border}` }}>
                  <Tag color="purple" style={{ marginBottom: '8px' }}>{secondaryLang.toUpperCase()}</Tag>
                  <Title level={4} style={{ color: s.heading, marginBottom: '12px', fontFamily: 'Georgia, serif' }}>
                    {secondaryText.title}
                  </Title>
                  <Paragraph 
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.8',
                      color: s.text,
                      fontFamily: 'Georgia, serif',
                      textAlign: 'justify'
                    }}
                  >
                    {secondaryText.body}
                  </Paragraph>
                </Col>
              </Row>
            ) : (
              <Paragraph 
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                  color: s.text,
                  fontFamily: 'Georgia, serif',
                  textAlign: 'justify'
                }}
              >
                {primaryText.body}
              </Paragraph>
            )}
          </div>
        )}
      </div>

      {/* PDF Footer page navigation controllers */}
      {isPdf && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
          <Button 
            shape="circle" 
            icon={<LeftOutlined />} 
            disabled={pdfPage <= 1} 
            onClick={() => setPdfPage(p => p - 1)} 
          />
          <Text style={{ fontWeight: 'bold' }}>
            {primaryLang === 'hi' ? `पृष्ठ ${pdfPage} / ${totalPdfPages}` : `Page ${pdfPage} of ${totalPdfPages}`}
          </Text>
          <Button 
            shape="circle" 
            icon={<RightOutlined />} 
            disabled={pdfPage >= totalPdfPages} 
            onClick={() => setPdfPage(p => p + 1)} 
          />
        </div>
      )}
    </Modal>
  );
}
