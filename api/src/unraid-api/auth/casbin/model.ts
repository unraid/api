export const CASBIN_MODEL = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = (regexMatch(r.sub, p.sub) || g(r.sub, p.sub)) && \
    regexMatch(lower(r.obj), lower(p.obj)) && \
    (regexMatch(lower(r.act), lower(p.act)) || p.act == '*' || regexMatch(lower(r.act), lower(concat(p.act, ':.*'))))
`;
