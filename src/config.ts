/**
 * This file imports the configuration details for the server's environment.
 *
 * @category Configuration
 *
 * @module Server Config.
 *
 * @hidden
 */

import dotenv = require('dotenv');
dotenv.config();
import convict from 'convict';
import convict_format_with_validator from 'convict-format-with-validator';

convict.addFormat(convict_format_with_validator.url);
convict.addFormat(convict_format_with_validator.ipaddress);

const config = convict({
  env: {
    doc: 'Application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  server: {
    host: {
      doc: 'Host name/IP address to bind.',
      format: 'url',
      default: 'localhost',
      env: 'HOST',
      arg: 'host',
    },
    port: {
      doc: 'Port to bind.',
      format: 'port',
      default: 4000,
      env: 'PORT',
      arg: 'port',
    },
    secret: {
      doc: 'JWT secret.',
      format: '*',
      default: '',
      env: 'JWT_SECRET',
      arg: 'jw_secret',
      sensitive: true,
    },
  },
  db: {
    host: {
      doc: 'Game database host name.',
      format: 'url',
      default: 'localhost',
      env: 'DB_HOST',
      arg: 'db_host',
    },
    port: {
      doc: 'Game database port.',
      format: 'port',
      default: 27017,
      env: 'DB_PORT',
      arg: 'db_port',
    },
    name: {
      doc: 'Game database name.',
      format: String,
      default: 'db',
      env: 'DB_NAME',
      arg: 'db_name',
    },
  },
  cookie: {
    domain: {
      doc: 'The domain to set on any cookies.',
      format: String,
      default: 'localhost',
      env: 'COOKIE_DOMAIN',
      arg: 'cookie_domain',
    },
    sameSite: {
      doc: 'The SameSite setting to use on any cookies.',
      format: String,
      default: 'Strict',
      env: 'COOKIE_SAMESITE',
      arg: 'cookie_samesite',
    },
    secure: {
      doc: 'The Secure setting to use on any cookies.',
      format: Boolean,
      default: true,
      env: 'COOKIE_SECURE',
      arg: 'cookie_secure',
    },
    path: {
      doc: 'The Path setting to use on any cookies.',
      format: String,
      default: '/',
      env: 'COOKIE_PATH',
      arg: 'cookie_path',
    },
  },
  email: {
    host: {
      doc: 'Email server host name.',
      format: 'url',
      default: 'localhost',
      env: 'SMTP_HOST',
      arg: 'smtp_host',
    },
    port: {
      doc: 'Email server port.',
      format: 'port',
      default: 30000,
      env: 'SMTP_PORT',
      arg: 'smtp_port',
    },
    user: {
      doc: 'Email server username.',
      format: '*',
      default: '',
      env: 'SMTP_USER',
      arg: 'smtp_user',
    },
    pass: {
      doc: 'Email server password.',
      format: '*',
      default: '',
      env: 'SMTP_PASS',
      arg: 'smtp_pass',
      sensitive: true,
    },
    from: {
      doc: 'Email sender host name.',
      format: String,
      default: 'noreply',
      env: 'SMTP_FROM',
      arg: 'smtp_from',
    },
  },
  repo: {
    token: {
      doc: 'Repository personal access token (PAT).',
      format: '*',
      default: '',
      env: 'REPO_TOKEN',
      arg: 'repo_token',
      sensitive: true,
    },
    server: {
      id: {
        doc: 'Server repo. ID.',
        format: Number,
        default: '',
        env: 'SERVER_REPO_ID',
        arg: 'server_repo_id',
      },
    },
    client: {
      id: {
        doc: 'Client repo. ID.',
        format: Number,
        default: '',
        env: 'CLIENT_REPO_ID',
        arg: 'client_repo_id',
      },
    },
  },
});

const env = config.get('env');

config.loadFile(__dirname + `/config/${env}.json`);
config.validate({ allowed: 'strict' });

export default config.getProperties();
