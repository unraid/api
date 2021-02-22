import { InternalGraphql } from './mothership/sockets/internal-graphql';
import { MothershipSocket } from './mothership/sockets/mothership';

export const sockets = new Map<'relay' | 'internalGraphql', MothershipSocket | InternalGraphql>();
