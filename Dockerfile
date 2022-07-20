###########################################################
# Development/Build Image
###########################################################
FROM node:18 As development


# Set env
ENV NODE_ENV=development

# Copy package lock and package into build image
WORKDIR /app
COPY package.json package-lock.json tsconfig.json .npmrc ./

# Install build tools
RUN apt-get update -y && apt-get install  -y \
python \
iptables \
libgl1-mesa-dri \
libgl1-mesa-glx \
libvirt-daemon-system \
libvirt-dev \
qemu-kvm \
virtinst \
virt-viewer

# Install dev deps
RUN npm i -f

RUN npm i -g nexe
# Run build script if one exists
# RUN npm run build --if-present

CMD []