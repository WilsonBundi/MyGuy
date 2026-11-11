import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import MyGuyIcon from '../src/components/MyGuyIcon';
import { useThemedStyles } from '../src/contexts/ThemeContext';
import { ThemedTextInput as TextInput } from '../src/components/ThemedTextInput';
import { sendPhoneVerificationCode, verifyPhoneCode } from '../src/lib/api';

const phoneCountries = [
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+30', flag: '🇬🇷', name: 'Greece' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+95', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+856', flag: '🇱🇦', name: 'Laos' }
];

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

function toInternationalPhone(countryCode: string, phoneInput: string) {
  const digits = phoneInput.replace(/\D/g, '');
  if (phoneInput.trim().startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return `${countryCode}${digits.replace(/^0+/, '')}`;
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const styles = useThemedStyles(baseStyles);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    phoneCountry: '+254',
    phone: '',
    verificationCode: '',
    bio: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPhoneCountryModal, setShowPhoneCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation for step transitions
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const animateStep = (newStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newStep > step ? -20 : 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(newStep);
      slideAnim.setValue(newStep > step ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      // Validate step 1
      if (!formData.displayName.trim()) {
        setError('Display name is required');
        return;
      }
      if (!formData.username.trim()) {
        setError('Username is required');
        return;
      }
      if (formData.username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      if (!formData.password) {
        setError('Password is required');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      animateStep(2);
    } else if (step === 2) {
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return;
      }
      if (!codeVerified || !phoneVerificationToken) {
        setError('Please verify your phone number before continuing');
        return;
      }
      animateStep(3);
    } else {
      // Validate step 3
      if (!formData.country.trim()) {
        setError('Country is required');
        return;
      }
      handleSignup();
    }
  };

  const handleSendCode = async () => {
    const phone = toInternationalPhone(formData.phoneCountry, formData.phone);
    if (phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) {
      setError('Please enter your phone number');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      await sendPhoneVerificationCode(phone);
      setCodeSent(true);
      setCodeVerified(false);
      setPhoneVerificationToken('');
      setFormData((current) => ({ ...current, verificationCode: '' }));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send the verification code.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const phone = toInternationalPhone(formData.phoneCountry, formData.phone);
    if (!codeSent || formData.verificationCode.length !== 6 || verifyingCode) return;
    setVerifyingCode(true);
    setError('');
    try {
      const result = await verifyPhoneCode(phone, formData.verificationCode);
      setPhoneVerificationToken(result.verificationToken);
      setCodeVerified(true);
    } catch (verifyError) {
      setPhoneVerificationToken('');
      setCodeVerified(false);
      setError(verifyError instanceof Error ? verifyError.message : 'Could not verify the code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSignup = async () => {
    if (!formData.phone.trim() || !codeVerified || !phoneVerificationToken) {
      setError('A verified phone number is required to create your account.');
      animateStep(2);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const signupData = {
        displayName: formData.displayName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: toInternationalPhone(formData.phoneCountry, formData.phone),
        phoneVerificationToken,
        country: formData.country,
        bio: formData.bio,
      };
      await signUp(signupData);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setError(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* MyGuy Icon */}
        <View style={styles.iconContainer}>
          <MyGuyIcon size={110} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Create your MyGuy account</Text>
        <Text style={styles.subtitle}>People. Moments. Everywhere.</Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCheckOuter}>
            <View style={styles.progressCheckInner}>
              <Ionicons name="checkmark" size={28} color="#ffffff" />
            </View>
          </View>
          <View style={styles.progressLineTrack}>
            <View style={styles.progressLineFill} />
          </View>
        </View>

        {error && step !== 3 && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Step 1: Account */}
        {step === 1 && (
          <Animated.View style={[styles.step, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={formData.displayName}
              onChangeText={(text) => setFormData({ ...formData, displayName: text })}
            />

            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputWithPrefix}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="chooseyourusername"
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
              />
            </View>
            <Text style={styles.fieldHint}>Your username is unique and will be used for your MyGuy profile.</Text>

            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {formData.password && (
              <View style={styles.passwordStrength}>
                <View style={styles.passwordStrengthBar}>
                  <View 
                    style={[
                      styles.passwordStrengthFill,
                      { width: `${(getPasswordStrength(formData.password) / 6) * 100}%` },
                      getPasswordStrength(formData.password) >= 1 && styles.strength1,
                      getPasswordStrength(formData.password) >= 2 && styles.strength2,
                      getPasswordStrength(formData.password) >= 3 && styles.strength3,
                      getPasswordStrength(formData.password) >= 4 && styles.strength4,
                      getPasswordStrength(formData.password) >= 5 && styles.strength5,
                    ]}
                  />
                </View>
                <Text style={styles.passwordStrengthText}>
                  {getPasswordStrength(formData.password) <= 2 ? 'Weak' : 
                   getPasswordStrength(formData.password) <= 4 ? 'Medium' : 'Strong'}
                </Text>
              </View>
            )}
            <Text style={styles.fieldHint}>Requirements: At least 8 characters</Text>

            <Text style={styles.fieldLabel}>Confirm password</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.inputIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!formData.displayName || !formData.username || !formData.email || !formData.password || formData.password !== formData.confirmPassword) && styles.buttonDisabled
              ]}
              onPress={handleNext}
              disabled={!formData.displayName || !formData.username || !formData.email || !formData.password || formData.password !== formData.confirmPassword}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 2: Verify & Protect */}
        {step === 2 && (
          <Animated.View style={[styles.step, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
            <Text style={styles.stepTitle}>Verify & protect</Text>
            <Text style={styles.stepSubtitle}>Secure your account</Text>

            <Text style={styles.fieldLabel}>Country / Region</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={formData.country ? styles.selectText : styles.selectPlaceholder}>
                {formData.country || 'Select your country'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Phone number (required)</Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity 
                style={styles.phoneCodeButton}
                onPress={() => setShowPhoneCountryModal(true)}
              >
                <Text style={styles.phoneCodeText}>
                  {phoneCountries.find((country) => country.code === formData.phoneCountry)?.flag} {formData.phoneCountry}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="7XX XXX XXX"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData((current) => ({ ...current, phone: text, verificationCode: '' }));
                  setCodeSent(false);
                  setCodeVerified(false);
                  setPhoneVerificationToken('');
                  setError('');
                }}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.fieldHint}>We’ll text a code to confirm you can access this number.</Text>

            {!codeVerified && (
              <>
                <TouchableOpacity 
                  style={[styles.button, (!formData.phone.trim() || sendingCode) && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={!formData.phone.trim() || sendingCode}
                >
                  <Text style={styles.buttonText}>
                    {sendingCode ? 'Sending...' : codeSent ? 'Resend Code' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>

                {codeSent && (
                  <>
                    <Text style={styles.fieldLabel}>Enter verification code</Text>
                    <View style={styles.verificationContainer}>
                      <TextInput
                        style={styles.verificationInput}
                        placeholder="Enter 6-digit code"
                        value={formData.verificationCode}
                        onChangeText={(text) => setFormData({ ...formData, verificationCode: text.replace(/\D/g, '').slice(0, 6) })}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity 
                        style={[styles.verifyButton, ((formData.verificationCode.length < 4) || verifyingCode) && styles.buttonDisabled]}
                        onPress={handleVerifyCode}
                        disabled={formData.verificationCode.length !== 6 || verifyingCode}
                      >
                        <Text style={styles.verifyButtonText}>{verifyingCode ? 'Checking...' : 'Verify'}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}

            {codeVerified && (
              <View style={styles.verifiedContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.verifiedText}>Phone number verified</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (!formData.phone.trim() || !codeVerified) && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!formData.phone.trim() || !codeVerified}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => animateStep(1)}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 3: Personalize */}
        {step === 3 && (
          <Animated.View style={[styles.step, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
            <Text style={styles.stepTitle}>Personalize</Text>
            <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Bio (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write something about yourself..."
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
              <Ionicons name="checkmark" size={20} color="#ffffff" style={styles.buttonIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => animateStep(2)}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <TouchableOpacity onPress={() => router.push('/signin')}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              value={countrySearch}
              onChangeText={setCountrySearch}
            />
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              style={styles.countryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setFormData({ ...formData, country: item });
                    setShowCountryModal(false);
                    setCountrySearch('');
                  }}
                >
                  <Text style={styles.countryName}>{item}</Text>
                  {formData.country === item && (
                    <Ionicons name="checkmark" size={20} color="#f97316" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPhoneCountryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPhoneCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select calling code</Text>
              <TouchableOpacity onPress={() => setShowPhoneCountryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              value={countrySearch}
              onChangeText={setCountrySearch}
            />
            <FlatList
              data={phoneCountries.filter((country) => country.name.toLowerCase().includes(countrySearch.toLowerCase()))}
              keyExtractor={(item, index) => `${item.code}-${item.name}-${index}`}
              style={styles.countryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setFormData((current) => ({ ...current, phoneCountry: item.code, verificationCode: '' }));
                    setCodeSent(false);
                    setCodeVerified(false);
                    setPhoneVerificationToken('');
                    setShowPhoneCountryModal(false);
                    setCountrySearch('');
                  }}
                >
                  <Text style={styles.countryName}>{item.flag} {item.name} ({item.code})</Text>
                  {formData.phoneCountry === item.code && (
                    <Ionicons name="checkmark" size={20} color="#f97316" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 22,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    width: '100%',
  },
  progressCheckOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  progressCheckInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLineTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f8d4b6',
    borderRadius: 999,
    marginLeft: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressLineFill: {
    flex: 1,
    backgroundColor: '#f97316',
    borderRadius: 999,
    width: '100%',
  },
  errorBox: {
    backgroundColor: '#f9d7d7',
    borderColor: '#f1b9b9',
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 18,
  },
  errorText: {
    color: '#cc4b4b',
    fontSize: 18,
    fontWeight: '700',
  },
  step: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    color: '#6b7280',
    fontSize: 14,
    marginRight: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginLeft: 8,
  },
  fieldHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 18,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strength1: { backgroundColor: '#ef4444' },
  strength2: { backgroundColor: '#f59e0b' },
  strength3: { backgroundColor: '#f97316' },
  strength4: { backgroundColor: '#22c55e' },
  strength5: { backgroundColor: '#16a34a' },
  passwordStrengthText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 18,
    borderRadius: 18,
    marginTop: 20,
    shadowColor: '#f97316',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    color: '#ffffff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    padding: 12,
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '600',
  },
  link: {
    color: '#f97316',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    color: '#111827',
    fontSize: 14,
  },
  selectPlaceholder: {
    color: '#9ca3af',
    fontSize: 14,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
  },
  phoneCodeText: {
    color: '#111827',
    fontSize: 14,
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginRight: 8,
  },
  verifyButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  verifiedText: {
    color: '#166534',
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  countryName: {
    fontSize: 14,
    color: '#111827',
  },
});
