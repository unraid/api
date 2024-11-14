export const CASBIN_MODEL = `
[request_definition]
r = sub, obj, act, poss

[policy_definition]
p = sub, obj, act, poss

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && \
    keyMatch2(r.obj, p.obj) && \
    (r.act == p.act || p.act == '*') && \
    (upper(r.poss) == upper(p.poss) || p.poss == '*')
`;
