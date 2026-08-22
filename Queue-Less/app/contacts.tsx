import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/theme';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import contactService, { ContactItem } from '../services/contactService';

export default function ContactsPickerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>([]);

  const requestContactsPermission = async () => {
    // Lazy permission request on user action
    setHasPermission(true);
    const list = await contactService.getContacts();
    setContacts(list);
  };

  const handleSelectContact = (contact: ContactItem) => {
    Alert.alert(
      'Contact Selected',
      `Queue token will be generated for ${contact.name} (${contact.phone}).`,
      [
        {
          text: 'Proceed to Queue',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleSearchChange = async (text: string) => {
    setSearch(text);
    const filtered = await contactService.getContacts(text);
    setContacts(filtered);
  };

  return (
    <View style={styles.container}>
      <Header title="Select Contact" subtitle="Join queue for someone else" showBack />

      <View style={styles.content}>
        {hasPermission === null ? (
          <View style={styles.permissionCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={40} color={Palette.primary} />
            </View>
            <Text style={styles.permissionTitle}>Contacts Permission Required</Text>
            <Text style={styles.permissionSubtitle}>
              Select a family member or friend from your device contacts to queue on their behalf.
            </Text>
            <Button
              title="Grant Contacts Permission"
              onPress={requestContactsPermission}
              style={styles.permissionBtn}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Input
              placeholder="Search contact by name or phone..."
              value={search}
              onChangeText={handleSearchChange}
              containerStyle={styles.searchBox}
            />

            <Text style={styles.listHeader}>Device Contacts ({contacts.length})</Text>

            {contacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                onPress={() => handleSelectContact(c)}
              >
                <Card style={styles.contactCard}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{c.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Palette.mutedText} />
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  permissionCard: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    marginTop: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    textAlign: 'center',
    marginVertical: Spacing.md,
    lineHeight: 20,
  },
  permissionBtn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  searchBox: {
    marginBottom: Spacing.md,
  },
  listHeader: {
    fontSize: 14,
    color: Palette.mutedText,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
    padding: Spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  contactPhone: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
});
