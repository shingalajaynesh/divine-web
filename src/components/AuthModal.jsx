import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, Button, Tabs, message, Space, Divider } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  GoogleOutlined,
  UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/email-already-in-use': 'An account already exists for this email address.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Console yet.',
  'auth/invalid-app-credential': 'Phone sign-in is not fully configured in Firebase yet. Check Authentication providers, authorized domains, and reCAPTCHA/App Check settings.',
  'auth/app-not-authorized': 'This Firebase app is not authorized for the selected sign-in method. Check your Firebase project settings.',
  'auth/invalid-phone-number': 'Enter a valid phone number including the country code.',
  'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
  'auth/invalid-verification-code': 'The OTP is incorrect or has expired.',
  'auth/unauthorized-domain': 'This website domain is not authorised in Firebase Authentication.',
  'auth/internal-error': 'Firebase rejected the request. Check Authentication providers and App Check configuration.',
  'auth/captcha-check-failed': 'The reCAPTCHA check failed. Refresh the page and try again.',
  'auth/quota-exceeded': 'The Firebase SMS quota has been reached. Please try again later.',
};

const getAuthErrorMessage = (error) => {
  const diagnosticText = `${error?.message || ''} ${JSON.stringify(error?.customData || {})}`;
  if (diagnosticText.includes('App Check')) {
    return 'Firebase App Check blocked this request. Configure the App Check site key or disable Authentication enforcement during development.';
  }
  if (diagnosticText.includes('sendVerificationCode') || diagnosticText.includes('401') || diagnosticText.includes('Unauthorized')) {
    return 'Phone OTP is not fully configured in Firebase yet. Enable Phone Authentication, add the current domain to authorized domains, and complete reCAPTCHA/App Check setup.';
  }
  return AUTH_ERROR_MESSAGES[error?.code] || 'Authentication could not be completed. Please try again.';
};

export default function AuthModal({ visible, onClose }) {
  const [messageApi, messageContext] = message.useMessage();
  const [activeTab, setActiveTab] = useState('email-login');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const recaptchaVerifierRef = useRef(null);



  const handleEmailLogin = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      messageApi.success('Logged in successfully!');
      onClose();
    } catch (error) {
      messageApi.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (values) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      if (values.displayName) {
        await updateProfile(userCredential.user, {
          displayName: values.displayName
        });
      }
      messageApi.success('Account created successfully!');
      onClose();
    } catch (error) {
      messageApi.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      messageApi.success('Logged in with Google!');
      onClose();
    } catch (error) {
      messageApi.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10 && !/^\+[1-9]\d{7,14}$/.test(phoneNumber.trim())) {
      return messageApi.error('Enter a valid mobile number with country code, or a 10-digit Indian number.');
    }
    // Ensure phone number has country code, default to +91 if none
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    setLoading(true);
    try {
      let verifier = recaptchaVerifierRef.current;
      if (!verifier) {
        // Ensure container is empty before rendering to prevent double render errors
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }

        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            messageApi.warning('reCAPTCHA expired. Please try sending OTP again.');
          }
        });
        recaptchaVerifierRef.current = verifier;
      }
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setVerificationId(confirmationResult);
      messageApi.success('OTP sent successfully to ' + formattedPhone);
    } catch (error) {
      messageApi.error(getAuthErrorMessage(error));
      // Reset recaptcha if it fails
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error(e);
        }
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      return messageApi.error('Please enter the OTP verification code.');
    }

    setLoading(true);
    try {
      await verificationId.confirm(otpCode);
      messageApi.success('Phone verified and logged in!');
      onClose();
      // Clear fields
      setVerificationId(null);
      setPhoneNumber('');
      setOtpCode('');
    } catch (error) {
      messageApi.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => {
    recaptchaVerifierRef.current?.clear();
    recaptchaVerifierRef.current = null;
  }, []);

  const handleCancel = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      recaptchaVerifierRef.current = null;
    }
    setVerificationId(null);
    setPhoneNumber('');
    setOtpCode('');
    onClose();
  };

  const tabItems = [
    {
      key: 'email-login',
      label: 'Sign In',
      children: (
        <Form onFinish={handleEmailLogin} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email Address" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Access Your Dashboard
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'email-signup',
      label: 'Sign Up',
      children: (
        <Form onFinish={handleEmailSignUp} layout="vertical">
          <Form.Item
            name="displayName"
            rules={[{ required: true, message: 'Please enter your name!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email Address" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter password!' }, { min: 6, message: 'Password must be at least 6 characters.' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Create Account
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'phone',
      label: 'Phone OTP',
      children: !verificationId ? (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Phone (e.g. 9876543210)"
            size="large"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleSendOTP}
            loading={loading}
          >
            Send OTP Verification
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            prefix={<LockOutlined />}
            placeholder="Enter 6-digit OTP"
            size="large"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleVerifyOTP}
            loading={loading}
          >
            Verify & Log In
          </Button>
          <Button
            type="link"
            block
            onClick={() => setVerificationId(null)}
          >
            Back to Phone Number
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      title={
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: '#f43f5e' }} />
          <h3 style={{ margin: '8px 0 0 0' }}>Join Divine Garbh Sanskar</h3>
        </div>
      }
    >
      {messageContext}
      <div id="recaptcha-container"></div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} centered items={tabItems} />

      <Divider plain>or</Divider>

      <Button
        icon={<GoogleOutlined />}
        size="large"
        block
        onClick={handleGoogleSignIn}
        loading={loading}
      >
        Continue with Google
      </Button>
    </Modal>
  );
}
