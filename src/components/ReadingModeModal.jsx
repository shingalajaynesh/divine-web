import React, { useState, useEffect } from 'react';
import { Modal, Button, Radio, Space, Divider, Typography, Tag } from 'antd';
import { 
  FontSizeOutlined, BgColorsOutlined, TranslationOutlined, 
  SoundOutlined, CopyOutlined 
} from '@ant-design/icons';
import toast from 'react-hot-toast';

const { Title, Paragraph } = Typography;

export default function ReadingModeModal({ visible, onClose, title, body, translations, lang }) {
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('reader_font_size') || '18'));
  const [theme, setTheme] = useState(() => localStorage.getItem('reader_theme') || 'sepia');
  const [bilingual, setBilingual] = useState(() => localStorage.getItem('reader_bilingual') === 'true');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('reader_bilingual', bilingual.toString());
  }, [bilingual]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleCopy = () => {
    const textToCopy = `${title}\n\n${body}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success(lang === 'hi' ? "टेक्स्ट कॉपी किया गया" : "Content copied to clipboard");
  };

  const toggleSpeech = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      const textToRead = body || '';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
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

  const currentLang = lang || 'en';
  const otherLang = currentLang === 'en' ? 'hi' : 'en';
  const otherTranslation = translations?.find(t => t.language === otherLang);

  return (
    <Modal
      open={visible}
      onCancel={() => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        onClose();
      }}
      footer={null}
      width={680}
      title={lang === 'hi' ? "रीडिंग मोड" : "Reader Mode"}
      destroyOnClose
      style={{ borderRadius: '24px', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px' }}>
        <Space>
          <FontSizeOutlined style={{ color: '#64748b' }} />
          <Radio.Group size="small" value={fontSize} onChange={e => setFontSize(e.target.value)}>
            <Radio.Button value={14}>A-</Radio.Button>
            <Radio.Button value={18}>A</Radio.Button>
            <Radio.Button value={22}>A+</Radio.Button>
            <Radio.Button value={26}>A++</Radio.Button>
          </Radio.Group>
        </Space>

        <Space>
          <BgColorsOutlined style={{ color: '#64748b' }} />
          <Radio.Group size="small" value={theme} onChange={e => setTheme(e.target.value)}>
            <Radio.Button value="light">{lang === 'hi' ? "उजाला" : "Light"}</Radio.Button>
            <Radio.Button value="sepia">{lang === 'hi' ? "सेपिया" : "Sepia"}</Radio.Button>
            <Radio.Button value="dark">{lang === 'hi' ? "अंधेरा" : "Dark"}</Radio.Button>
          </Radio.Group>
        </Space>

        <Space>
          {translations?.length > 1 && (
            <Button 
              size="small" 
              type={bilingual ? 'primary' : 'default'} 
              icon={<TranslationOutlined />} 
              onClick={() => setBilingual(!bilingual)}
            >
              {lang === 'hi' ? "द्विभाषी" : "Bilingual"}
            </Button>
          )}

          <Button 
            size="small" 
            type={speaking ? 'primary' : 'default'} 
            danger={speaking}
            icon={<SoundOutlined />} 
            onClick={toggleSpeech}
          >
            {speaking ? (lang === 'hi' ? "रोकें" : "Stop") : (lang === 'hi' ? "सुने" : "Listen")}
          </Button>

          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} />
        </Space>
      </div>

      <div 
        style={{
          backgroundColor: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: '16px',
          padding: '24px 32px',
          maxHeight: '440px',
          overflowY: 'auto',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <Title level={3} style={{ color: s.heading, marginBottom: '20px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
          {title}
        </Title>

        {bilingual && otherTranslation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <Tag color="orange" style={{ marginBottom: '8px' }}>{currentLang === 'hi' ? 'Hindi' : 'English'}</Tag>
              <Paragraph 
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                  color: s.text,
                  fontFamily: 'Georgia, serif',
                  textAlign: 'justify'
                }}
              >
                {body}
              </Paragraph>
            </div>
            <Divider style={{ margin: '12px 0', borderColor: s.border }} />
            <div>
              <Tag color="cyan" style={{ marginBottom: '8px' }}>{otherLang === 'hi' ? 'Hindi' : 'English'}</Tag>
              <Title level={4} style={{ color: s.heading, marginBottom: '12px', fontFamily: 'Georgia, serif' }}>
                {otherTranslation.title}
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
                {otherTranslation.body}
              </Paragraph>
            </div>
          </div>
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
            {body}
          </Paragraph>
        )}
      </div>
    </Modal>
  );
}
