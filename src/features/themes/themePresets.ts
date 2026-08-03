export interface TerminalTheme {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  cursorColor: string;
  promptUserHostColor: string;
  promptSeparatorColor: string;
  promptPathColor: string;
  promptSymbolColor: string;
  headerBackground: string;
  headerTextColor: string;
  buttonStyle: 'ubuntu' | 'macos' | 'simple';
}

export const THEME_PRESETS: Record<string, TerminalTheme> = {
  ubuntu: {
    id: 'ubuntu',
    name: 'Ubuntu Default',
    backgroundColor: '#300A24',
    textColor: '#DFDBCE',
    cursorColor: '#DFDBCE',
    promptUserHostColor: '#8AE234', // Green username@host
    promptSeparatorColor: '#DFDBCE',
    promptPathColor: '#729FCF',     // Blue path
    promptSymbolColor: '#DFDBCE',
    headerBackground: '#2d0922',
    headerTextColor: '#DFDBCE',
    buttonStyle: 'ubuntu',
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    backgroundColor: '#282a36',
    textColor: '#f8f8f2',
    cursorColor: '#f8f8f2',
    promptUserHostColor: '#8be9fd', // Cyan
    promptSeparatorColor: '#ff79c6', // Pink
    promptPathColor: '#bd93f9',     // Purple
    promptSymbolColor: '#50fa7b',     // Green
    headerBackground: '#191a21',
    headerTextColor: '#f8f8f2',
    buttonStyle: 'macos',
  },
  kali: {
    id: 'kali',
    name: 'Kali Linux',
    backgroundColor: '#0f1015',
    textColor: '#c2c2c2',
    cursorColor: '#00ff00',
    promptUserHostColor: '#ff2a2a', // Red
    promptSeparatorColor: '#c2c2c2',
    promptPathColor: '#589cc5',     // Light Blue
    promptSymbolColor: '#ff2a2a',
    headerBackground: '#151821',
    headerTextColor: '#c2c2c2',
    buttonStyle: 'simple',
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin Macchiato',
    backgroundColor: '#24273a',
    textColor: '#cad3f5',
    cursorColor: '#f4dbd6',
    promptUserHostColor: '#b7bdf8', // Lavender
    promptSeparatorColor: '#f5bde6', // Pink
    promptPathColor: '#8aadf4',     // Blue
    promptSymbolColor: '#a6da95',     // Green
    headerBackground: '#1e2030',
    headerTextColor: '#cad3f5',
    buttonStyle: 'macos',
  },
  oneDark: {
    id: 'oneDark',
    name: 'One Dark',
    backgroundColor: '#282c34',
    textColor: '#abb2bf',
    cursorColor: '#528bff',
    promptUserHostColor: '#98c379', // Green
    promptSeparatorColor: '#abb2bf',
    promptPathColor: '#61afef',     // Blue
    promptSymbolColor: '#c678dd',     // Magenta
    headerBackground: '#21252b',
    headerTextColor: '#abb2bf',
    buttonStyle: 'simple',
  },
  solarizedDark: {
    id: 'solarizedDark',
    name: 'Solarized Dark',
    backgroundColor: '#002b36',
    textColor: '#839496',
    cursorColor: '#93a1a1',
    promptUserHostColor: '#268bd2', // Blue
    promptSeparatorColor: '#586e75',
    promptPathColor: '#859900',     // Green
    promptSymbolColor: '#2aa198',     // Cyan
    headerBackground: '#073642',
    headerTextColor: '#839496',
    buttonStyle: 'macos',
  },
};
