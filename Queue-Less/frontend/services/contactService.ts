export interface ContactItem {
  id: string;
  name: string;
  phone: string;
}

const MOCK_CONTACTS: ContactItem[] = [
  { id: 'c1', name: 'Alice Smith', phone: '+1 (555) 019-2834' },
  { id: 'c2', name: 'Bob Johnson', phone: '+1 (555) 012-9843' },
  { id: 'c3', name: 'David Williams', phone: '+1 (555) 017-5642' },
  { id: 'c4', name: 'Emma Davis', phone: '+1 (555) 014-3829' },
];

export const contactService = {
  async getContacts(searchQuery?: string): Promise<ContactItem[]> {
    if (!searchQuery) return MOCK_CONTACTS;
    return MOCK_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
  },
};

export default contactService;
