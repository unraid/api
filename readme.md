<!-- Adapted from: https://github.com/othneildrew/Best-README-Template -->
<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
[![Codecov][codecov-shield]][codecov-url]
[![Apollo Studio][apollo-studio-shield]][apollo-studio-url]

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/unraid/api)

</div>
<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/unraid/api">
    <img src=".github/unraid.svg" alt="Logo" width="80" height="80"/>
  </a>

<h3 align="center">Unraid API</h3>

  <p align="center">
    Monorepo for the Unraid API and Unraid Connect.
    <br />
    <a href="https://docs.unraid.net/API/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    ·
    <a href="https://github.com/unraid/api/issues/new?template=bug_report.md">Report Bug</a>
    ·
    <a href="https://github.com/unraid/api/issues/new?template=feature_request.md">Request Feature</a>
    ·
    <a href="https://github.com/unraid/api/issues/new?template=work_intent.md&type=task">Submit Work Intent</a>
  </p>
</div>

<!-- PLUGIN DOWNLOADS -->
<div align="center">
  <h3>🔌 Plugin Downloads</h3>
  <p>
    <a href="https://stable.dl.unraid.net/unraid-api/dynamix.unraid.net.plg">
      <img src="https://img.shields.io/badge/Production-Download-green?style=for-the-badge&logo=download" alt="Production Plugin" />
    </a>
    &nbsp;&nbsp;
    <a href="https://preview.dl.unraid.net/unraid-api/dynamix.unraid.net.plg">
      <img src="https://img.shields.io/badge/Staging-Download-orange?style=for-the-badge&logo=download" alt="Staging Plugin" />
    </a>
  </p>
  <p>
    <strong>Production:</strong> <a href="https://stable.dl.unraid.net/unraid-api/dynamix.unraid.net.plg">https://stable.dl.unraid.net/unraid-api/dynamix.unraid.net.plg</a>
    <br />
    <strong>Staging:</strong> <a href="https://preview.dl.unraid.net/unraid-api/dynamix.unraid.net.plg">https://preview.dl.unraid.net/unraid-api/dynamix.unraid.net.plg</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://unraid.net)

<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

### Built With

[![Unraid][Unraid]][Unraid-url]
[![Node.js][Node.js]][Node-url]
[![Vite][Vite-badge]][Vite-url]
[![Nuxt][Nuxt.js]][Nuxt-url]
[![PHP][PHP]][PHP-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

This section will guide you through the steps necessary to get the monorepo projects running and
communicating with each other.

### Prerequisites

Make sure the following software is installed before proceeding.

- Bash
- Docker (for macOS folks, Orbstack works too)
- [Node.js (v22)][Node-url]
- [pnpm](https://pnpm.io/) (v9.0+) - Install with `npm install -g pnpm`
- [Just](https://github.com/casey/just) (optional)
- libvirt (macOS folks can run `brew install libvirt`)
- rclone (v1.70+) - **Important:** Version 1.70 or higher is required
- jq - JSON processor for scripts
- An [Unraid][Unraid-url] server for development

#### Ubuntu/WSL Users

For Ubuntu or WSL users, note that the default Ubuntu repositories may have older versions of rclone. You'll need rclone v1.70 or higher, which can be obtained from the [rclone releases page](https://github.com/rclone/rclone/releases).

#### Verify Prerequisites

After installation, verify your dependencies:

```sh
# Verify installations and versions
node --version  # Should be v22.x
pnpm --version  # Should be v9.0+
rclone version  # Should be v1.70+
jq --version    # Should be installed
docker --version  # Should be installed
```

#### Alternative: Using Nix Flake

If you have [Nix](https://nixos.org/) installed, you can use the provided flake to automatically set up all development dependencies:

```sh
nix develop
```

This will provide all the required tools (Node.js, Docker, Just, libvirt, rclone, etc.) without needing to install them manually.

#### SSH Key Setup

Next, create an SSH key if you haven't already.
Once you have your key pair, add your public SSH key to your Unraid server:

1. Log in to your Unraid development server.
2. Use the navigation menu to go to 'Users'.
3. Click on the user you logged in with (e.g. `root`)
4. Paste your SSH public key into 'SSH authorized keys' and click 'Save'.

### Installation

1. Clone and enter the repo

   ```sh
   git clone git@github.com:unraid/api.git
   cd api
   ```

   If using Nix, enter the development environment:

   ```sh
   nix develop
   ```

2. Install dependencies and verify they're correctly installed:

   ```sh
   # Install all monorepo dependencies
   pnpm install
   
   # The install script will automatically check for required dependencies
   # and their versions (rclone v1.70+, jq, pnpm, etc.)
   ```

3. Build the project:

   ```sh
   # Build individual packages first (from root directory)
   cd api && pnpm build && cd ..
   cd web && pnpm build && cd ..
   
   # Then build the plugin if needed
   cd plugin && pnpm build && cd ..
   ```

   Note: The packages must be built in order as the plugin depends on the API build artifacts.

### Development Modes

The project supports two development modes:

#### Mode 1: Build Watcher with Local Plugin

This mode builds the plugin continuously and serves it locally for installation on your Unraid server:

```sh
# From the root directory (api/)
pnpm build:watch
```

This command will output a local plugin URL that you can install on your Unraid server by navigating to Plugins → Install Plugin. Be aware it will take a *while* to build the first time.

#### Mode 2: Development Servers

For active development with hot-reload:

```sh
# From the root directory - runs all dev servers concurrently
pnpm dev
```

Or run individual development servers:

```sh
# API server (GraphQL backend at http://localhost:3001)
cd api && pnpm dev

# Web interface (Nuxt frontend at http://localhost:3000) 
cd web && pnpm dev
```

### Building the Full Plugin

To build the complete plugin package (.plg file):

```sh
# From the root directory (api/)
pnpm build:plugin

# The plugin will be created in plugin/dynamix.unraid.net.plg
```

To deploy the plugin to your Unraid server:

```sh
# Replace SERVER_IP with your Unraid server's IP address
pnpm unraid:deploy SERVER_IP
```

> [!TIP]
> View other workflows (local dev, etc.) in the [Developer Workflows](./api/docs/developer/workflows.md)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

See [How to Use the API](./api/docs/public/how-to-use-the-api.md).

_For more examples, please refer to the [Documentation](https://docs.unraid.net/API/how-to-use-the-api/)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
<!-- ## Roadmap

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3
    - [ ] Nested Feature

See the [open issues](https://github.com/unraid/api/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- CONTRIBUTING -->

## Contributing

For a complete guide on contributing to the project, including our code of conduct and development process, please see our [Contributing Guide](./CONTRIBUTING.md). Please read this before contributing.

### Developer Documentation

For more information about development workflows, repository organization, and other technical details, please refer to the developer documentation inside this repository:

- [Development Guide](./api/docs/developer/development.md) - Setup, building, and debugging instructions
- [Development Workflows](./api/docs/developer/workflows.md) - Detailed workflows for local development, building, and deployment
- [Repository Organization](./api/docs/developer/repo-organization.md) - High-level architecture and project structure

### Work Intent Process

Before starting development work on this project, you must submit a Work Intent and have it approved by a core developer. This helps prevent duplicate work and ensures changes align with the project's goals.

1. **Create a Work Intent**

   - Go to [Issues → New Issue → Work Intent](https://github.com/unraid/api/issues/new?template=work_intent.md)
   - Fill out the brief template describing what you want to work on
   - The issue will be automatically labeled as `work-intent` and `unapproved`

2. **Wait for Approval**

   - A core developer will review your Work Intent
   - They may ask questions or suggest changes
   - Once approved, the `unapproved` label will be removed

3. **Begin Development**
   - Only start coding after your Work Intent is approved
   - Follow the approach outlined in your approved Work Intent
   - Reference the Work Intent in your future PR

---

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors

<a href="https://github.com/unraid/api/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=unraid/api" alt="contrib.rocks image" />
</a>

<!-- Community & Acknowledgements -->

## Community

🌐 [Forums](https://forums.unraid.net/)  
💬 [Discord](https://discord.unraid.net/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

[@UnraidOfficial](https://twitter.com/UnraidOfficial) - <contact@unraid.net>

Project Link: [https://github.com/unraid/api](https://github.com/unraid/api)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/unraid/api.svg?style=for-the-badge
[contributors-url]: https://github.com/unraid/api/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/unraid/api.svg?style=for-the-badge
[forks-url]: https://github.com/unraid/api/network/members
[stars-shield]: https://img.shields.io/github/stars/unraid/api.svg?style=for-the-badge
[stars-url]: https://github.com/unraid/api/stargazers
[issues-shield]: https://img.shields.io/github/issues/unraid/api.svg?style=for-the-badge
[issues-url]: https://github.com/unraid/api/issues
[license-shield]: https://img.shields.io/badge/License-GPL--2.0-default?style=for-the-badge&color=red
[license-url]: https://github.com/unraid/api/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/unraid
[codecov-shield]: https://img.shields.io/codecov/c/github/unraid/api?style=for-the-badge
[codecov-url]: https://codecov.io/gh/unraid/api
[apollo-studio-shield]: https://img.shields.io/badge/Apollo%20Studio-View%20Schema-311C87?style=for-the-badge&logo=apollographql&logoColor=white
[apollo-studio-url]: https://studio.apollographql.com/graph/Unraid-API/variant/current/home
[Nuxt.js]: https://img.shields.io/badge/Nuxt-002E3B?style=for-the-badge&logo=nuxtdotjs&logoColor=#00DC82
[Node.js]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[PHP]: https://img.shields.io/badge/php-%23777BB4.svg?style=for-the-badge&logo=php&logoColor=white
[Unraid]: https://img.shields.io/badge/unraid-%23F15A2C.svg?style=for-the-badge&logo=unraid&logoColor=white
[Unraid-url]: https://unraid.net
[Nuxt-url]: https://nuxt.com/
[Node-url]: https://nodejs.org/
[PHP-url]: https://php.net/
[Vite-badge]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white
[Vite-url]: https://vite.dev/
