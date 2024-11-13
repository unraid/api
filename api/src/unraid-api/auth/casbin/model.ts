export const CASBIN_MODEL = `
[request_definition]
r = sub, obj, act_poss

[policy_definition]
p = sub, obj, act_poss

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && \
    keyMatch2(r.obj, p.obj) && \
    (r.act_poss == p.act_poss || p.act_poss == '*')
`;
