export const CASBIN_MODEL = `
[request_definition]
r = sub, obj, act, possession

[policy_definition]
p = sub, obj, act, possession

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && (r.act == p.act || p.act == '*') && (r.possession == p.possession || p.possession == '*')
`;
