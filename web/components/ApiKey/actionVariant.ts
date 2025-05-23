export function actionVariant(action: string):
  | 'black'
  | 'gray'
  | 'white'
  | 'custom'
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'transparent'
  | 'current'
  | null
  | undefined {
  switch (action) {
    case 'read':
      return 'blue';
    case 'write':
      return 'yellow';
    case 'delete':
      return 'red';
    case 'update':
      return 'orange';
    case 'execute':
      return 'purple';
    default:
      return 'gray';
  }
} 