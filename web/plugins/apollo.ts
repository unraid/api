import { defineNuxtPlugin } from '#imports';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { client } from '~/helpers/create-apollo-client';

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.provide(DefaultApolloClient, client);
}); 
