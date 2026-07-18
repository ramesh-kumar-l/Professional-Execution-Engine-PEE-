// NativeWind's own `nativewind/types` -> `react-native-css-interop/types` reference chain
// augments a *nested* copy of react-native (nativewind/node_modules/react-native), not the one
// this app's own dependency on react-native resolves to — a duplicate-hoisting artifact of this
// monorepo's install. Augmenting directly here (resolved against this file's own react-native
// import, i.e. apps/mobile/node_modules/react-native) avoids depending on that resolution lining
// up correctly.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
}
