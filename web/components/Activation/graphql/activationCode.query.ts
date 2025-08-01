import { graphql } from '~/composables/gql/gql';


export const PARTNER_INFO_QUERY = graphql(/* GraphQL */ `
  query PartnerInfo {
    publicPartnerInfo {
      hasPartnerLogo
      partnerName
      partnerUrl
      partnerLogoUrl
    }
  }
`);

export const PUBLIC_WELCOME_DATA_QUERY = graphql(/* GraphQL */ `
  query PublicWelcomeData {
    publicPartnerInfo {
      hasPartnerLogo
      partnerName
      partnerUrl
      partnerLogoUrl
    }
    isInitialSetup
  }
`);

export const ACTIVATION_CODE_QUERY = graphql(/* GraphQL */ `
  query ActivationCode {
    vars {
      regState
    }
    customization {
      activationCode {
        code
        partnerName
        serverName
        sysModel
        comment
        header
        headermetacolor
        background
        showBannerGradient
        theme
      }
      partnerInfo {
        hasPartnerLogo
        partnerName
        partnerUrl
        partnerLogoUrl
      }
    }
  }
`);
