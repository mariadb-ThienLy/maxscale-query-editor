# maxscale-query-editor

## Introduction

This is a prototype of making maxscale query-editor in maxgui to be a vue es module so
that it can be used in vue application.

#### rollup-plugin-vue

This uses `rollup-plugin-vue` to bundle query editor into es module.
The module will currently work in modern browsers but not on legacy and IE browsers.

### How to use it

`npm run build` will bundle and pack it to a tarball file. i.e. `maxscale-query-editor-1.0.0.tgz`

In your application, `npm install maxscale-query-editor-1.0.0.tgz`
