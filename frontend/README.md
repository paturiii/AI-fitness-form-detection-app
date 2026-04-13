# File Structure

```
frontend/
├── App.tsx
└── src/
    ├── context/AuthContext.tsx
    ├── services/api.ts
    ├── navigation/
    │   ├── RootNavigator.tsx  # Auth guard: shows AuthStack or AppTabs
    │   ├── AuthStack.tsx      # Login → Signup
    │   └── AppTabs.tsx        # Home | Profile | Settings
    └── screens/
        ├── auth/
        │   ├── LoginScreen.tsx
        │   └── SignupScreen.tsx
        ├── home
        │   ├── Edit.tsx
        │   ├── HomeScreen.tsx
        │   └── HomeScreenStack.tsx
        ├── profile
        │   └── ProfileScreen.tsx
        ├── settings
        │   └── SettingsScreen.tsx
        └── workout
            ├── NewWorkout.tsx
            ├── StartWorkout.tsx
            ├── WorkoutScreen.tsx
            └── WorkoutStack.tsx
```