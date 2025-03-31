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

* Bash
* Docker (for macOS folks, Orbstack works too)
* [Node.js (v20)][Node-url]
* [Just](https://github.com/casey/just) (optional)
* libvirt (macOS folks can run `brew install libvirt`)
* An [Unraid][Unraid-url] server for development

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

2. Run the monorepo setup command.

   ```sh
    pnpm install
   ```

3. Run the build watcher to build the components and serve a local plugin file that can be installed on your Unraid server.

   ```sh
   pnpm build:watch
   ```

   Navigate to Plugins->Install and install the local plugin file that is output to the console.

> [!TIP]
> View other workflows (local dev, etc.) in the [Developer Workflows](./api/docs/developer/workflows.md)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://docs.unraid.net/)_

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

* [Development Guide](./api/docs/developer/development.md) - Setup, building, and debugging instructions
* [Development Workflows](./api/docs/developer/workflows.md) - Detailed workflows for local development, building, and deployment
* [Repository Organization](./api/docs/developer/repo-organization.md) - High-level architecture and project structure

### Work Intent Process

Before starting development work on this project, you must submit a Work Intent and have it approved by a core developer. This helps prevent duplicate work and ensures changes align with the project's goals.

1. **Create a Work Intent**
   * Go to [Issues → New Issue → Work Intent](https://github.com/unraid/api/issues/new?template=work_intent.md)
   * Fill out the brief template describing what you want to work on
   * The issue will be automatically labeled as `work-intent` and `unapproved`

2. **Wait for Approval**
   * A core developer will review your Work Intent
   * They may ask questions or suggest changes
   * Once approved, the `unapproved` label will be removed

3. **Begin Development**
   * Only start coding after your Work Intent is approved
   * Follow the approach outlined in your approved Work Intent
   * Reference the Work Intent in your future PR

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

<!-- LICENSE -->
<!-- ## License

<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- Community & Acknowledgements -->
## Community

🌐 [Forums](https://forums.unraid.net/)  
💬 [Discord](https://discord.unraid.net/)  
🐦 [Reddit](https://www.reddit.com/r/unRAID/)

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
[license-url]: https://github.com/unraid/api/blob/main/LICENSE.md
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/unraid
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
