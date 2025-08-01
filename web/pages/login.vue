<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useI18n } from 'vue-i18n';
import SsoButtonCe from '~/components/SsoButton.ce.vue';
import { SERVER_INFO_QUERY } from './login.query';

const { t } = useI18n();
const { result } = useQuery(SERVER_INFO_QUERY);

const serverName = computed(() => result.value?.info?.os?.hostname || 'UNRAID');
const serverComment = computed(() => result.value?.vars?.comment || '');
</script>

<template>
  <section id="login" class="shadow">
      <div class="logo angle">
        <div class="wordmark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 222.4 39" class="Nav__logo--white">
            <path
              fill="#ffffff"
              d="M146.70000000000002 29.5H135l-3 9h-6.5L138.9 0h8l13.4 38.5h-7.1L142.6 6.9l-5.8 16.9h8.2l1.7 5.7zM29.7 0v25.4c0 8.9-5.8 13.6-14.9 13.6C5.8 39 0 34.3 0 25.4V0h6.5v25.4c0 5.2 3.2 7.9 8.2 7.9 5.2 0 8.4-2.7 8.4-7.9V0h6.6zM50.9 12v26.5h-6.5V0h6.1l17 26.5V0H74v38.5h-6.1L50.9 12zM171.3 0h6.5v38.5h-6.5V0zM222.4 24.7c0 9-5.9 13.8-15.2 13.8h-14.5V0h14.6c9.2 0 15.1 4.8 15.1 13.8v10.9zm-6.6-10.9c0-5.3-3.3-8.1-8.5-8.1h-8.1v27.1h8c5.3 0 8.6-2.8 8.6-8.1V13.8zM108.3 23.9c4.3-1.6 6.9-5.3 6.9-11.5 0-8.7-5.1-12.4-12.8-12.4H88.8v38.5h6.5V5.7h6.9c3.8 0 6.2 1.8 6.2 6.7s-2.4 6.8-6.2 6.8h-3.4l9.2 19.4h7.5l-7.2-14.7z"
            />
          </svg>
        </div>
      </div>
      <div class="content">
        <h1>{{ serverName }}</h1>
        <h2>{{ serverComment }}</h2>

        <div class="case">
          <!-- Case icon will be implemented in a future update -->
        </div>

        <div class="form">
          <form action="/login" method="POST">
            <p>
              <input
                name="username"
                type="text"
                :placeholder="t('Username')"
                autocapitalize="none"
                autocomplete="off"
                spellcheck="false"
                autofocus
                required
              >
              <input name="password" type="password" :placeholder="t('Password')" required>
            </p>
            <p>
              <button type="submit" class="button button--small">{{ t('Login') }}</button>
            </p>
          </form>
          <!-- SSO Button will show when GraphQL query isSSOEnabled returns true -->
          <SsoButtonCe />
        </div>

        <a href="https://docs.unraid.net/go/lost-root-password/" target="_blank" class="password-recovery">{{ t('Password recovery') }}</a>
      </div>
    </section>
</template>
<style scoped>
/************************
/
/  Fonts
/
/************************/
/************************
/
/  General styling
/
/************************/
body {
  background: #f2f2f2;
  color: #1c1b1b;
  font-family: clear-sans, sans-serif;
  font-size: 0.875rem;
  padding: 0;
  margin: 0;
}
a {
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 2px;
  color: #ff8c2f;
  text-decoration: none;
}
a:hover {
  color: #f15a2c;
}
h1 {
  font-size: 1.8em;
  margin: 0;
}
h2 {
  font-size: 0.8em;
  margin-top: 0;
  margin-bottom: 1.8em;
}
.button {
  color: #ff8c2f;
  font-family: clear-sans, sans-serif;
  background:
    -webkit-gradient(linear, left top, right top, from(#e03237), to(#fd8c3c)) 0 0 no-repeat,
    -webkit-gradient(linear, left top, right top, from(#e03237), to(#fd8c3c)) 0 100% no-repeat,
    -webkit-gradient(linear, left bottom, left top, from(#e03237), to(#e03237)) 0 100% no-repeat,
    -webkit-gradient(linear, left bottom, left top, from(#fd8c3c), to(#fd8c3c)) 100% 100% no-repeat;
  background:
    linear-gradient(90deg, #e03237 0, #fd8c3c) 0 0 no-repeat,
    linear-gradient(90deg, #e03237 0, #fd8c3c) 0 100% no-repeat,
    linear-gradient(0deg, #e03237 0, #e03237) 0 100% no-repeat,
    linear-gradient(0deg, #fd8c3c 0, #fd8c3c) 100% 100% no-repeat;
  background-size:
    100% 2px,
    100% 2px,
    2px 100%,
    2px 100%;
}
.button:hover {
  color: #fff;
  background-color: #f15a2c;
  background: -webkit-gradient(linear, left top, right top, from(#e22828), to(#ff8c2f));
  background: linear-gradient(90deg, #e22828 0, #ff8c2f);
  -webkit-box-shadow: none;
  box-shadow: none;
  cursor: pointer;
}
.button--small {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  background-color: transparent;
  border-radius: 0.125rem;
  border: 0;
  -webkit-transition: none;
  transition: none;
  padding: 0.75rem 1.5rem;
}
[type='email'],
[type='number'],
[type='password'],
[type='search'],
[type='tel'],
[type='text'],
[type='url'],
textarea {
  font-family: clear-sans, sans-serif;
  font-size: 0.875rem;
  background-color: #f2f2f2;
  width: 100%;
  margin-bottom: 1rem;
  border: 2px solid #ccc;
  padding: 0.75rem 1rem;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border-radius: 0;
  -webkit-appearance: none;
}
[type='email']:active,
[type='email']:focus,
[type='number']:active,
[type='number']:focus,
[type='password']:active,
[type='password']:focus,
[type='search']:active,
[type='search']:focus,
[type='tel']:active,
[type='tel']:focus,
[type='text']:active,
[type='text']:focus,
[type='url']:active,
[type='url']:focus,
textarea:active,
textarea:focus {
  border-color: #ff8c2f;
  outline: none;
}

/************************
/
/  Login specific styling
/
/************************/
#login {
  width: 500px;
  margin: 6rem auto;
  border-radius: 10px;
  background: #fff;
}
#login::after {
  content: '';
  clear: both;
  display: table;
}
#login .logo {
  position: relative;
  overflow: hidden;
  height: 120px;
  border-radius: 10px 10px 0 0;
}
#login .wordmark {
  z-index: 1;
  position: relative;
  padding: 2rem;
}
#login .wordmark svg {
  width: 100px;
}
#login .case {
  float: right;
  width: 30%;
  font-size: 6rem;
  text-align: center;
}
#login .case img {
  max-width: 96px;
  max-height: 96px;
}
#login .error {
  color: red;
  margin-top: -20px;
}
#login .content {
  padding: 2rem;
}
#login .form {
  width: 65%;
}
.angle:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120px;
  background-color: #f15a2c;
  background: -webkit-gradient(linear, left top, right top, from(#e22828), to(#ff8c2f));
  background: linear-gradient(90deg, #e22828 0, #ff8c2f);
  -webkit-transform-origin: bottom left;
  transform-origin: bottom left;
  -webkit-transform: skewY(-6deg);
  transform: skewY(-6deg);
  -webkit-transition: -webkit-transform 0.15s linear;
  transition: -webkit-transform 0.15s linear;
  transition: transform 0.15s linear;
  transition:
    transform 0.15s linear,
    -webkit-transform 0.15s linear;
}
.shadow {
  -webkit-box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.12);
}
.password-recovery {
  display: block;
  margin-top: 1rem;
  text-align: center;
}
.hidden {
  display: none;
}
/************************
/
/  Cases
/
/************************/
[class^='case-'],
[class*=' case-'] {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'cases' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/************************
/
/  Media queries for mobile responsive
/
/************************/
@media (max-width: 500px) {
  body {
    background: #fff;
  }
  [type='email'],
  [type='number'],
  [type='password'],
  [type='search'],
  [type='tel'],
  [type='text'],
  [type='url'],
  textarea {
    font-size: 16px; /* This prevents the mobile browser from zooming in on the input-field. */
  }
  #login {
    margin: 0;
    border-radius: 0;
    width: 100%;
  }
  #login .logo {
    border-radius: 0;
  }
  .shadow {
    box-shadow: none;
  }
}
</style>
