import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */

const config: Config = {
  title: 'seclog',
  tagline: 'Security stuff and CTF write-ups',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://www.johannes-merkert.de',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'hueami', // Usually your GitHub org/user name.
  projectName: 'seclog', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'seclog',
        logo: {
          alt: 'seclog Logo',
          src: 'img/hacker.svg',
        },
        items: [
          {to: '/blog', label: 'Blog', position: 'left'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Links',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/hueami',
              }
            ]
          },
          {
            title: 'Impressum',
            items: [
              {
                html: `
                <p>Johannes Merkert<br>
                St. Dionysius-Str. 46<br>
                72108 Rottenburg</p>`
              },
              {
                html: `
                <a href="mailto:johannes.merkert@gmail.com">johannes.merkert@gmail.com</a>`
              },
            ]
          },
          {
            title: 'Credits',
            items: [
              {
                label: 'Hacker graphic',
                href: 'https://www.svgrepo.com/svg/493162/hacker',
              }
            ]
          }
        ],
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
