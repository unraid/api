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
    case 'create':
      return 'green';
    case 'update':
      return 'yellow';
    case 'delete':
      return 'pink';
    default:
      return 'gray';
  }
} 
