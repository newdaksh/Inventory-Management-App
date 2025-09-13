# Inventory Management App - React Native Expo

A complete inventory management mobile application built with React Native, Expo SDK 54, TypeScript, and integrated with n8n workflow backend for JWT authentication, MongoDB storage, and Google Sheets inventory tracking.

## Features

### Admin Panel

- **Dashboard**: KPIs, low stock alerts, expiring item notifications
- **Inventory Management**: Full CRUD operations for items
- **Photo Upload**: Camera/gallery integration for item photos
- **Order Management**: View and manage customer orders
- **JWT Authentication**: Secure admin login

### Customer Portal

- **Product Browse**: View available items with stock and pricing
- **Cart Management**: Add/remove items, quantity controls
- **Order Placement**: Seamless checkout experience
- **PDF Invoice Generation**: Download/share order receipts
- **Auto Registration**: First-time customer account creation

### Technical Features

- **Offline Support**: Mock data mode when backend unavailable
- **Optimistic UI**: Immediate feedback with error rollback
- **JWT Token Management**: Secure storage with expo-secure-store
- **Real-time Validation**: Form validation with react-hook-form + yup
- **TypeScript**: Full type safety throughout the application

## Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v16 or higher)
2. **Expo CLI**: `npm install -g expo-cli`
3. **Expo Go app** on your mobile device (for testing)
4. **n8n workflow** running with the provided workflow JSON

## Installation

1. **Clone/Download** this project
2. **Install dependencies**:

   ```bash
   cd inventory-management-expo
   npm install
   ```

3. **Configure your backend URL**:
   - Open `src/CONFIG.ts`
   - Update `BASE_URL` to point to your n8n instance:
   ```typescript
   export const CONFIG = {
     BASE_URL: "https://your-n8n-instance.com/webhook",
     // For local development:
     // BASE_URL: 'http://localhost:5678/webhook',
   };
   ```

## Running the App

1. **Start the Expo development server**:

   ```bash
   npm start
   ```

2. **Run on device/simulator**:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

## Backend Setup (n8n Workflow)

This app connects to the n8n workflow provided in the attachment. The workflow handles:

### Endpoints Used by the App:

- `POST /webhook/auth/admin/login` - Admin authentication
- `POST /webhook/auth/customer/login` - Customer login/registration
- `GET /webhook/inventory/items` - Fetch inventory (admin only)
- `POST /webhook/inventory/items` - Add new item (admin only)
- `PUT /webhook/inventory/items` - Update item (admin only)
- `DELETE /webhook/inventory/items` - Delete item (admin only)
- `POST /webhook/orders/place` - Place customer order

### Required n8n Setup:

1. Import the provided `Inventory-v1.json` workflow into your n8n instance
2. Configure MongoDB connection for customer/admin storage
3. Configure Google Sheets connection for inventory tracking
4. Set up JWT credentials for token signing/verification
5. Deploy webhook URLs and update `CONFIG.ts` accordingly

## Testing

### Mock Mode

If your backend is not available, enable mock mode:

```typescript
// In src/CONFIG.ts
export const CONFIG = {
  MOCK_MODE: true, // Enable mock data
  // ... other config
};
```

### Test Credentials

For testing with your n8n backend:

- **Admin**: Use credentials stored in your MongoDB admins collection
- **Customer**: Any name will work (auto-registration)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Custom button component
│   ├── Input.tsx       # Form input component
│   ├── Card.tsx        # Container component
│   ├── ItemRow.tsx     # Product display component
│   ├── Loading.tsx     # Loading indicator
│   └── ModalConfirm.tsx # Confirmation dialog
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state management
│   └── useCart.ts      # Shopping cart state management
├── screens/            # App screens/pages
│   ├── Welcome.tsx     # Landing page
│   ├── AdminLogin.tsx  # Admin authentication
│   ├── CustomerLogin.tsx # Customer authentication
│   ├── AdminDashboard.tsx # Admin overview
│   └── [other screens] # Additional app screens
├── services/           # External service integrations
│   └── api.ts          # HTTP client with JWT injection
├── types/              # TypeScript type definitions
│   └── index.ts        # All app interfaces
├── utils/              # Utility functions
│   └── pdf.ts          # PDF generation utilities
└── CONFIG.ts           # App configuration
```

## Key Components

### Authentication Flow

1. **Welcome Screen**: Choose Admin or Customer portal
2. **Admin Login**: Email/password authentication
3. **Customer Login**: Name-based quick registration
4. **JWT Storage**: Secure token persistence with expo-secure-store

### State Management

- **AuthProvider**: Global authentication state
- **CartProvider**: Shopping cart state and calculations
- **Optimistic Updates**: Immediate UI feedback

### API Integration

- **JWT Headers**: Automatic token injection
- **401 Handling**: Auto-logout on token expiration
- **Error Handling**: User-friendly error messages
- **Mock Support**: Fallback for development

## Customization

### Styling

- Modify styles in individual component files
- Update `CONFIG.ts` for currency, thresholds, etc.
- Color scheme can be changed in component StyleSheet objects

### API Endpoints

- All endpoints are defined in `CONFIG.ts`
- Easy to switch between development/production URLs
- Mock mode for offline development

### Features

- Add new inventory fields by updating `Item` interface
- Extend cart functionality in `useCart.ts`
- Add new screens following existing patterns

## Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**:

   - Verify `BASE_URL` in `CONFIG.ts`
   - Ensure n8n workflow is active
   - Try enabling `MOCK_MODE` for testing

2. **"JWT token invalid"**:

   - Clear app storage and re-login
   - Check n8n JWT credentials configuration

3. **"Build errors"**:

   - Run `expo install` to fix dependency issues
   - Clear Metro cache: `expo start -c`

4. **"Images not uploading"**:
   - Ensure expo-image-picker permissions
   - Check network connectivity
   - Verify n8n handles base64 image data

### Development Tips

- Use Expo Go for rapid testing
- Enable network debugging in Expo DevTools
- Check Metro logs for API errors
- Use React DevTools for state debugging

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review n8n workflow configuration
3. Verify all dependencies are correctly installed
4. Ensure backend endpoints are accessible
