/var/log/unraid-api/*.log {
    rotate 1
    missingok
    size 1M
    su root root
    compress
    delaycompress
    copytruncate
    create 0640 root root
}
/var/log/graphql-api.log {
    rotate 1
    missingok
    size 1M
    su root root
    compress
    delaycompress
    copytruncate
    create 0640 root root
}
