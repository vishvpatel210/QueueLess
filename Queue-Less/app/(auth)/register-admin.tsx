import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const CATEGORIES = [
  'Healthcare',
  'Salon & Spa',
  'Bank & Finance',
  'Retail',
  'Dining & Cafe',
  'Government Services',
  'Service Center',
  'Other',
];

interface CustomServiceDraft {
  name: string;
  description: string;
  estimatedDurationMinutes: string;
  price: string;
  prefix: string;
}

export default function ShopAdminRegisterScreen() {
  const router = useRouter();
  const { registerShopAdmin, isLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Step 1: Admin Credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Business Info
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // Step 3: Branch Info & Location
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState('19.0760');
  const [longitude, setLongitude] = useState('72.8777');

  // Step 4: Operating Hours
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');

  // Step 5: Custom Services
  const [services, setServices] = useState<CustomServiceDraft[]>([
    {
      name: 'General Consultation',
      description: 'Standard consultation and check-in',
      estimatedDurationMinutes: '15',
      price: '0',
      prefix: 'A',
    },
  ]);

  const [errorMessage, setErrorMessage] = useState('');

  const fetchDeviceGPS = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Please allow location access to auto-fill branch coordinates.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(loc.coords.latitude.toFixed(6));
      setLongitude(loc.coords.longitude.toFixed(6));
    } catch (e: any) {
      Alert.alert('GPS Error', 'Could not retrieve GPS coordinates. You can enter them manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const addServiceRow = () => {
    const nextPrefixChar = String.fromCharCode(65 + (services.length % 26));
    setServices([
      ...services,
      {
        name: '',
        description: '',
        estimatedDurationMinutes: '15',
        price: '0',
        prefix: nextPrefixChar,
      },
    ]);
  };

  const removeServiceRow = (index: number) => {
    if (services.length === 1) {
      Alert.alert('At least one service', 'Please configure at least one service for your queue.');
      return;
    }
    setServices(services.filter((_, i) => i !== index));
  };

  const updateServiceField = (
    index: number,
    field: keyof CustomServiceDraft,
    val: string
  ) => {
    const copy = [...services];
    copy[index][field] = val;
    setServices(copy);
  };

  const validateStep = (step: number): boolean => {
    setErrorMessage('');
    if (step === 1) {
      if (!name.trim()) {
        setErrorMessage('Full name is required.');
        return false;
      }
      if (!email.trim() || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
        setErrorMessage('A valid email address is required.');
        return false;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return false;
      }
    } else if (step === 2) {
      if (!businessName.trim()) {
        setErrorMessage('Business name is required.');
        return false;
      }
      if (!category) {
        setErrorMessage('Please select a business category.');
        return false;
      }
    } else if (step === 3) {
      if (!branchName.trim()) {
        setErrorMessage('Branch name is required.');
        return false;
      }
      if (!address.trim()) {
        setErrorMessage('Branch address is required.');
        return false;
      }
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setErrorMessage('Please provide valid latitude and longitude coordinates.');
        return false;
      }
    } else if (step === 4) {
      if (!openTime.trim() || !closeTime.trim()) {
        setErrorMessage('Operating hours open and close time are required.');
        return false;
      }
    } else if (step === 5) {
      for (let i = 0; i < services.length; i++) {
        if (!services[i].name.trim()) {
          setErrorMessage(`Service #${i + 1} name cannot be empty.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleCompleteRegistration = async () => {
    if (!validateStep(5)) return;

    const formattedServices = services.map((s) => ({
      name: s.name.trim(),
      description: s.description.trim(),
      estimatedDurationMinutes: parseInt(s.estimatedDurationMinutes, 10) || 15,
      price: parseFloat(s.price) || 0,
      prefix: (s.prefix || 'A').toUpperCase().trim(),
    }));

    try {
      await registerShopAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        website: website.trim(),
        businessPhone: businessPhone.trim(),
        businessEmail: businessEmail.trim(),
        branchName: branchName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim(),
        latitude: parseFloat(latitude) || 19.0760,
        longitude: parseFloat(longitude) || 72.8777,
        operatingHours: { open: openTime.trim(), close: closeTime.trim() },
        services: formattedServices,
      });

      router.replace('/(admin)/dashboard' as any);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Shop Admin registration failed. Please check your details and try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Branding */}
        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>QueueLess</Text>
          <Text style={styles.brandTagline}>Smart Digital Queue Platform</Text>
        </View>

        {/* Role Switcher Tabs */}
        <View style={styles.roleSwitcherContainer}>
          <TouchableOpacity
            style={styles.roleTab}
            onPress={() => router.replace('/(auth)/register' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.roleTabIcon}>👤</Text>
            <Text style={styles.roleTabText}>Customer / Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, styles.roleTabActive]}
            activeOpacity={0.9}
          >
            <Text style={styles.roleTabIcon}>🏢</Text>
            <Text style={[styles.roleTabText, styles.roleTabTextActive]}>
              Hospital / Shop
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepsBar}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep === step && styles.stepCircleActive,
                  currentStep > step && styles.stepCircleDone,
                ]}
              >
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={14} color="#0B0D0E" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      currentStep === step && styles.stepNumberActive,
                    ]}
                  >
                    {step}
                  </Text>
                )}
              </View>
              <Text style={styles.stepLabel}>
                {step === 1
                  ? 'Admin'
                  : step === 2
                  ? 'Business'
                  : step === 3
                  ? 'Branch'
                  : step === 4
                  ? 'Hours'
                  : 'Services'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Palette.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* STEP 1: Admin Info */}
          {currentStep === 1 && (
            <View>
              <Text style={styles.stepTitle}>Step 1: Admin Account</Text>
              <Text style={styles.stepSubtitle}>
                Create credentials for managing your digital queues
              </Text>

              <Input
                label="Full Name *"
                placeholder="Dr. Rajesh Sharma / Manager"
                value={name}
                onChangeText={setName}
              />
              <Input
                label="Email Address *"
                placeholder="admin@myclinic.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                label="Personal / Admin Phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Input
                label="Password (min 6 chars) *"
                placeholder="Enter strong password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Input
                label="Confirm Password *"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}

          {/* STEP 2: Business Info */}
          {currentStep === 2 && (
            <View>
              <Text style={styles.stepTitle}>Step 2: Business Information</Text>
              <Text style={styles.stepSubtitle}>
                Enter the official details of your enterprise
              </Text>

              <Input
                label="Business Name *"
                placeholder="e.g. City Care Super Specialty Hospital"
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Text style={styles.fieldLabel}>Business Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBadge,
                      category === cat && styles.categoryBadgeActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Input
                label="Description"
                placeholder="Specialty clinic, OPD, lab diagnostics, etc."
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Input
                label="Business Website"
                placeholder="https://citycare.org"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
              />
              <Input
                label="Official Contact Phone"
                placeholder="Landline / Support Phone"
                value={businessPhone}
                onChangeText={setBusinessPhone}
                keyboardType="phone-pad"
              />
              <Input
                label="Official Contact Email"
                placeholder="support@citycare.org"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          {/* STEP 3: Branch Info & GPS Coordinates */}
          {currentStep === 3 && (
            <View>
              <Text style={styles.stepTitle}>Step 3: Branch & Real Location</Text>
              <Text style={styles.stepSubtitle}>
                Branch details with GeoJSON coordinates for customer discovery
              </Text>

              <Input
                label="Branch Name *"
                placeholder="e.g. Downtown Central OPD / Branch 1"
                value={branchName}
                onChangeText={setBranchName}
              />
              <Input
                label="Street Address *"
                placeholder="104 Medical Hub Road, Near Station Square"
                value={address}
                onChangeText={setAddress}
              />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Input label="City" placeholder="Mumbai" value={city} onChangeText={setCity} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="State" placeholder="Maharashtra" value={state} onChangeText={setState} />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Input label="Pincode" placeholder="400001" value={pincode} onChangeText={setPincode} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Landmark" placeholder="Opposite Metro Gate" value={landmark} onChangeText={setLandmark} />
                </View>
              </View>

              {/* GPS Auto-Fill Button */}
              <TouchableOpacity
                style={styles.gpsButton}
                onPress={fetchDeviceGPS}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color={Palette.primary} />
                ) : (
                  <>
                    <Ionicons name="navigate" size={18} color={Palette.primary} />
                    <Text style={styles.gpsButtonText}>Auto-Detect Current GPS Coordinates</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Latitude (North) *"
                    placeholder="19.0760"
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Longitude (East) *"
                    placeholder="72.8777"
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 4: Operating Hours */}
          {currentStep === 4 && (
            <View>
              <Text style={styles.stepTitle}>Step 4: Operating Hours</Text>
              <Text style={styles.stepSubtitle}>
                Define daily business hours for queue availability
              </Text>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Opening Time *"
                    placeholder="09:00"
                    value={openTime}
                    onChangeText={setOpenTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Closing Time *"
                    placeholder="18:00"
                    value={closeTime}
                    onChangeText={setCloseTime}
                  />
                </View>
              </View>

              <Card style={styles.infoCard}>
                <Ionicons name="time-outline" size={24} color={Palette.primary} />
                <Text style={styles.infoCardText}>
                  Your digital queue will automatically open and allow customer check-ins between {openTime} and {closeTime}.
                </Text>
              </Card>
            </View>
          )}

          {/* STEP 5: Custom Services */}
          {currentStep === 5 && (
            <View>
              <View style={styles.servicesHeaderRow}>
                <View>
                  <Text style={styles.stepTitle}>Step 5: Queue Services</Text>
                  <Text style={styles.stepSubtitle}>
                    Add the services customers can book tokens for
                  </Text>
                </View>
                <TouchableOpacity style={styles.addServiceBtn} onPress={addServiceRow}>
                  <Ionicons name="add-circle" size={20} color={Palette.primary} />
                  <Text style={styles.addServiceText}>Add Service</Text>
                </TouchableOpacity>
              </View>

              {services.map((srv, idx) => (
                <Card key={idx} style={styles.serviceDraftCard}>
                  <View style={styles.serviceCardHeader}>
                    <Badge label={`Service #${idx + 1}`} variant="primary" />
                    {services.length > 1 && (
                      <TouchableOpacity onPress={() => removeServiceRow(idx)}>
                        <Ionicons name="trash-outline" size={18} color={Palette.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Input
                    label="Service Name *"
                    placeholder="e.g. General Consultation / Blood Test"
                    value={srv.name}
                    onChangeText={(val) => updateServiceField(idx, 'name', val)}
                  />
                  <Input
                    label="Description"
                    placeholder="Brief details about the service"
                    value={srv.description}
                    onChangeText={(val) => updateServiceField(idx, 'description', val)}
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Duration (mins)"
                        placeholder="15"
                        value={srv.estimatedDurationMinutes}
                        onChangeText={(val) => updateServiceField(idx, 'estimatedDurationMinutes', val)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Token Prefix"
                        placeholder="A"
                        value={srv.prefix}
                        onChangeText={(val) => updateServiceField(idx, 'prefix', val.toUpperCase())}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Navigation Actions */}
          <View style={styles.actionRow}>
            {currentStep > 1 && (
              <Button
                title="Back"
                variant="outline"
                onPress={handleBack}
                style={styles.backBtn}
              />
            )}

            {currentStep < 5 ? (
              <Button
                title="Next Step ➔"
                onPress={handleNext}
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                title="Complete & Launch Business 🚀"
                onPress={handleCompleteRegistration}
                loading={isLoading}
                style={{ flex: 1 }}
              />
            )}
          </View>

          {currentStep === 1 && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already registered? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.primary,
  },
  brandTagline: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
  stepsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    borderColor: Palette.primary,
    backgroundColor: 'rgba(0, 229, 155, 0.15)',
  },
  stepCircleDone: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.mutedText,
  },
  stepNumberActive: {
    color: Palette.primary,
  },
  stepLabel: {
    fontSize: 10,
    color: Palette.mutedText,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.danger,
  },
  errorText: {
    color: Palette.danger,
    fontSize: 13,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: Spacing.xs,
  },
  categoryBadgeActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  categoryTextActive: {
    color: '#0B0D0E',
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 229, 155, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.primary,
    marginBottom: Spacing.md,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Palette.surface,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: Palette.mutedText,
    lineHeight: 18,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  addServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(0, 229, 155, 0.12)',
    borderRadius: BorderRadius.sm,
  },
  addServiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
  serviceDraftCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Palette.surface,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  backBtn: {
    flex: 0.4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    color: Palette.mutedText,
    fontSize: 14,
  },
  linkText: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  roleSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: Palette.primary,
  },
  roleTabIcon: {
    fontSize: 15,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.mutedText,
  },
  roleTabTextActive: {
    color: '#0B0D0E',
  },
});
