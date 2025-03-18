{
  description = "Unraid Connect Monorepo Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and pnpm
            nodejs_22
            nodePackages.pnpm

            # Development tools
            just
            git

            # libvirt (for development)
            libvirt

            # Docker (for development)
            docker
          ];

          shellHook = ''
            echo "🚀 Unraid Connect Development Environment"
            echo "Node.js version: $(node --version)"
            echo "pnpm version: $(pnpm --version)"
            echo "just version: $(just --version)"
            echo "git version: $(git --version)"
            echo "docker version: $(docker --version)"
            echo "libvirt version: $(virsh --version)"
          '';
        };
      }
    );
} 