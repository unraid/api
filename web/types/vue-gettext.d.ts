import 'vue';

declare module 'vue' {
  interface ComponentCustomProperties {
    $gettext: (text: string) => string;
    $ngettext: (singular: string, plural: string, count: number) => string;
    $pgettext: (context: string, text: string) => string;
  }
} 