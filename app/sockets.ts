import { InternalGraphql } from './mothership/sockets/internal-graphql';
import { MothershipSocket } from './mothership/sockets/mothership';

export const sockets = new Map<string, MothershipSocket | InternalGraphql>();
