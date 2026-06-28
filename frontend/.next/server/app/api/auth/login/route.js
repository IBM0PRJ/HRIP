"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/login/route";
exports.ids = ["app/api/auth/login/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "dns":
/*!**********************!*\
  !*** external "dns" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("dns");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("net");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_rahul_Desktop_hrip_frontend_app_api_auth_login_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/login/route.ts */ \"(rsc)/./app/api/auth/login/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/login/route\",\n        pathname: \"/api/auth/login\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/login/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\rahul\\\\Desktop\\\\hrip\\\\frontend\\\\app\\\\api\\\\auth\\\\login\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_rahul_Desktop_hrip_frontend_app_api_auth_login_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/login/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGbG9naW4lMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkZsb2dpbiUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkZsb2dpbiUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNyYWh1bCU1Q0Rlc2t0b3AlNUNocmlwJTVDZnJvbnRlbmQlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q3JhaHVsJTVDRGVza3RvcCU1Q2hyaXAlNUNmcm9udGVuZCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQzBCO0FBQ3ZHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaHJpcC1mcm9udGVuZC8/ZDRlOCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxyYWh1bFxcXFxEZXNrdG9wXFxcXGhyaXBcXFxcZnJvbnRlbmRcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXGxvZ2luXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcInN0YW5kYWxvbmVcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYXV0aC9sb2dpbi9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvbG9naW5cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2F1dGgvbG9naW4vcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxyYWh1bFxcXFxEZXNrdG9wXFxcXGhyaXBcXFxcZnJvbnRlbmRcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXGxvZ2luXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9hdXRoL2xvZ2luL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/auth/login/route.ts":
/*!*************************************!*\
  !*** ./app/api/auth/login/route.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../lib/db */ \"(rsc)/./lib/db.ts\");\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../lib/auth */ \"(rsc)/./lib/auth.ts\");\n/* harmony import */ var _lib_email__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../lib/email */ \"(rsc)/./lib/email.ts\");\n\n\n\n\n\nasync function POST(request) {\n    try {\n        const { email, password, role } = await request.json();\n        if (!email || !password || !role) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Missing fields\"\n            }, {\n                status: 400\n            });\n        }\n        const normalizedEmail = email.toLowerCase();\n        if (role === \"employee\") {\n            const employee = await _lib_db__WEBPACK_IMPORTED_MODULE_1__[\"default\"].employee.findUnique({\n                where: {\n                    email: normalizedEmail\n                }\n            });\n            if (!employee) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Invalid credentials\"\n                }, {\n                    status: 401\n                });\n            }\n            const isValid = await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_2__.verifyPassword)(password, employee.passwordHash);\n            if (!isValid) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Invalid credentials\"\n                }, {\n                    status: 401\n                });\n            }\n            if (!employee.isVerified) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Account not verified\"\n                }, {\n                    status: 403\n                });\n            }\n            // Employee does NOT get a cookie here — goes through Zero-Trust onboarding\n            const redirectTo = `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`;\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                success: true,\n                redirectTo\n            });\n        } else if (role === \"analyst\") {\n            const analyst = await _lib_db__WEBPACK_IMPORTED_MODULE_1__[\"default\"].analyst.findUnique({\n                where: {\n                    email: normalizedEmail\n                }\n            });\n            if (!analyst) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Invalid credentials\"\n                }, {\n                    status: 401\n                });\n            }\n            const isValid = await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_2__.verifyPassword)(password, analyst.passwordHash);\n            if (!isValid) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Invalid credentials\"\n                }, {\n                    status: 401\n                });\n            }\n            if (!analyst.isApproved) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Account not approved. Contact your administrator.\"\n                }, {\n                    status: 403\n                });\n            }\n            // Generate OTP and send via email — do NOT issue cookie yet\n            const otp = (0,_lib_auth__WEBPACK_IMPORTED_MODULE_2__.generateOTP)();\n            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes\n            // Invalidate any previous unused OTPs for this analyst\n            await _lib_db__WEBPACK_IMPORTED_MODULE_1__[\"default\"].oTPCode.updateMany({\n                where: {\n                    email: normalizedEmail,\n                    purpose: \"analyst_login\",\n                    used: false\n                },\n                data: {\n                    used: true\n                }\n            });\n            await _lib_db__WEBPACK_IMPORTED_MODULE_1__[\"default\"].oTPCode.create({\n                data: {\n                    email: normalizedEmail,\n                    code: otp,\n                    purpose: \"analyst_login\",\n                    expiresAt\n                }\n            });\n            try {\n                await (0,_lib_email__WEBPACK_IMPORTED_MODULE_3__.sendOTPEmail)(normalizedEmail, otp, \"analyst_login\");\n            } catch (emailErr) {\n                console.error(\"OTP email failed:\", emailErr);\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: \"Failed to send OTP email. Check SMTP configuration.\"\n                }, {\n                    status: 500\n                });\n            }\n            // Signal frontend to show OTP step\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                success: true,\n                step: \"otp\",\n                email: normalizedEmail\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Invalid role\"\n        }, {\n            status: 400\n        });\n    } catch (error) {\n        console.error(\"Login error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to process login\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Z0JBQ3ZFQyxNQUFNO29CQUFFRCxNQUFNO2dCQUFLO1lBQ3JCO1lBRUEsTUFBTWxDLCtDQUFNQSxDQUFDK0IsT0FBTyxDQUFDSyxNQUFNLENBQUM7Z0JBQzFCRCxNQUFNO29CQUFFN0IsT0FBT007b0JBQWlCeUIsTUFBTVY7b0JBQUtNLFNBQVM7b0JBQWlCTDtnQkFBVTtZQUNqRjtZQUVBLElBQUk7Z0JBQ0YsTUFBTXpCLHdEQUFZQSxDQUFDUyxpQkFBaUJlLEtBQUs7WUFDM0MsRUFBRSxPQUFPVyxVQUFVO2dCQUNqQkMsUUFBUTdCLEtBQUssQ0FBQyxxQkFBcUI0QjtnQkFDbkMsT0FBT3ZDLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7b0JBQUVDLE9BQU87Z0JBQXNELEdBQUc7b0JBQUVDLFFBQVE7Z0JBQUk7WUFDM0c7WUFFQSxtQ0FBbUM7WUFDbkMsT0FBT1oscURBQVlBLENBQUNVLElBQUksQ0FBQztnQkFBRWUsU0FBUztnQkFBTWdCLE1BQU07Z0JBQU9sQyxPQUFPTTtZQUFnQjtRQUNoRjtRQUVBLE9BQU9iLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFlLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3BFLEVBQUUsT0FBT0QsT0FBTztRQUNkNkIsUUFBUTdCLEtBQUssQ0FBQyxnQkFBZ0JBO1FBQzlCLE9BQU9YLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUEwQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUMvRTtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaHJpcC1mcm9udGVuZC8uL2FwcC9hcGkvYXV0aC9sb2dpbi9yb3V0ZS50cz80ZjI0Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHByaXNtYSBmcm9tIFwiLi4vLi4vLi4vLi4vbGliL2RiXCI7XG5pbXBvcnQgeyB2ZXJpZnlQYXNzd29yZCB9IGZyb20gXCIuLi8uLi8uLi8uLi9saWIvYXV0aFwiO1xuaW1wb3J0IHsgc2V0QW5hbHlzdENvb2tpZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9saWIvc2Vzc2lvblwiO1xuaW1wb3J0IHsgZ2VuZXJhdGVPVFAgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbGliL2F1dGhcIjtcbmltcG9ydCB7IHNlbmRPVFBFbWFpbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9saWIvZW1haWxcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogUmVxdWVzdCkge1xuICB0cnkge1xuICAgIGNvbnN0IHsgZW1haWwsIHBhc3N3b3JkLCByb2xlIH0gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTtcblxuICAgIGlmICghZW1haWwgfHwgIXBhc3N3b3JkIHx8ICFyb2xlKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJNaXNzaW5nIGZpZWxkc1wiIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplZEVtYWlsID0gZW1haWwudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmIChyb2xlID09PSBcImVtcGxveWVlXCIpIHtcbiAgICAgIGNvbnN0IGVtcGxveWVlID0gYXdhaXQgcHJpc21hLmVtcGxveWVlLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBlbWFpbDogbm9ybWFsaXplZEVtYWlsIH0gfSk7XG4gICAgICBpZiAoIWVtcGxveWVlKSB7XG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIkludmFsaWQgY3JlZGVudGlhbHNcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc1ZhbGlkID0gYXdhaXQgdmVyaWZ5UGFzc3dvcmQocGFzc3dvcmQsIGVtcGxveWVlLnBhc3N3b3JkSGFzaCk7XG4gICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCBjcmVkZW50aWFsc1wiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZW1wbG95ZWUuaXNWZXJpZmllZCkge1xuICAgICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJBY2NvdW50IG5vdCB2ZXJpZmllZFwiIH0sIHsgc3RhdHVzOiA0MDMgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEVtcGxveWVlIGRvZXMgTk9UIGdldCBhIGNvb2tpZSBoZXJlIOKAlCBnb2VzIHRocm91Z2ggWmVyby1UcnVzdCBvbmJvYXJkaW5nXG4gICAgICBjb25zdCByZWRpcmVjdFRvID0gYC9vbmJvYXJkaW5nP2VtYWlsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGVtcGxveWVlLmVtYWlsKX0mbmFtZT0ke2VuY29kZVVSSUNvbXBvbmVudChlbXBsb3llZS5uYW1lKX0mZGVwdD0ke2VuY29kZVVSSUNvbXBvbmVudChlbXBsb3llZS5kZXBhcnRtZW50KX1gO1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgc3VjY2VzczogdHJ1ZSwgcmVkaXJlY3RUbyB9KTtcblxuICAgIH0gZWxzZSBpZiAocm9sZSA9PT0gXCJhbmFseXN0XCIpIHtcbiAgICAgIGNvbnN0IGFuYWx5c3QgPSBhd2FpdCBwcmlzbWEuYW5hbHlzdC5maW5kVW5pcXVlKHsgd2hlcmU6IHsgZW1haWw6IG5vcm1hbGl6ZWRFbWFpbCB9IH0pO1xuICAgICAgaWYgKCFhbmFseXN0KSB7XG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIkludmFsaWQgY3JlZGVudGlhbHNcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc1ZhbGlkID0gYXdhaXQgdmVyaWZ5UGFzc3dvcmQocGFzc3dvcmQsIGFuYWx5c3QucGFzc3dvcmRIYXNoKTtcbiAgICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJJbnZhbGlkIGNyZWRlbnRpYWxzXCIgfSwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhbmFseXN0LmlzQXBwcm92ZWQpIHtcbiAgICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiQWNjb3VudCBub3QgYXBwcm92ZWQuIENvbnRhY3QgeW91ciBhZG1pbmlzdHJhdG9yLlwiIH0sIHsgc3RhdHVzOiA0MDMgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIE9UUCBhbmQgc2VuZCB2aWEgZW1haWwg4oCUIGRvIE5PVCBpc3N1ZSBjb29raWUgeWV0XG4gICAgICBjb25zdCBvdHAgPSBnZW5lcmF0ZU9UUCgpO1xuICAgICAgY29uc3QgZXhwaXJlc0F0ID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDEwICogNjAgKiAxMDAwKTsgLy8gMTAgbWludXRlc1xuXG4gICAgICAvLyBJbnZhbGlkYXRlIGFueSBwcmV2aW91cyB1bnVzZWQgT1RQcyBmb3IgdGhpcyBhbmFseXN0XG4gICAgICBhd2FpdCBwcmlzbWEub1RQQ29kZS51cGRhdGVNYW55KHtcbiAgICAgICAgd2hlcmU6IHsgZW1haWw6IG5vcm1hbGl6ZWRFbWFpbCwgcHVycG9zZTogXCJhbmFseXN0X2xvZ2luXCIsIHVzZWQ6IGZhbHNlIH0sXG4gICAgICAgIGRhdGE6IHsgdXNlZDogdHJ1ZSB9XG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgcHJpc21hLm9UUENvZGUuY3JlYXRlKHtcbiAgICAgICAgZGF0YTogeyBlbWFpbDogbm9ybWFsaXplZEVtYWlsLCBjb2RlOiBvdHAsIHB1cnBvc2U6IFwiYW5hbHlzdF9sb2dpblwiLCBleHBpcmVzQXQgfVxuICAgICAgfSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHNlbmRPVFBFbWFpbChub3JtYWxpemVkRW1haWwsIG90cCwgXCJhbmFseXN0X2xvZ2luXCIpO1xuICAgICAgfSBjYXRjaCAoZW1haWxFcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk9UUCBlbWFpbCBmYWlsZWQ6XCIsIGVtYWlsRXJyKTtcbiAgICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHNlbmQgT1RQIGVtYWlsLiBDaGVjayBTTVRQIGNvbmZpZ3VyYXRpb24uXCIgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2lnbmFsIGZyb250ZW5kIHRvIHNob3cgT1RQIHN0ZXBcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHN0ZXA6IFwib3RwXCIsIGVtYWlsOiBub3JtYWxpemVkRW1haWwgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCByb2xlXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTG9naW4gZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJGYWlsZWQgdG8gcHJvY2VzcyBsb2dpblwiIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJwcmlzbWEiLCJ2ZXJpZnlQYXNzd29yZCIsImdlbmVyYXRlT1RQIiwic2VuZE9UUEVtYWlsIiwiUE9TVCIsInJlcXVlc3QiLCJlbWFpbCIsInBhc3N3b3JkIiwicm9sZSIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsIm5vcm1hbGl6ZWRFbWFpbCIsInRvTG93ZXJDYXNlIiwiZW1wbG95ZWUiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJpc1ZhbGlkIiwicGFzc3dvcmRIYXNoIiwiaXNWZXJpZmllZCIsInJlZGlyZWN0VG8iLCJlbmNvZGVVUklDb21wb25lbnQiLCJuYW1lIiwiZGVwYXJ0bWVudCIsInN1Y2Nlc3MiLCJhbmFseXN0IiwiaXNBcHByb3ZlZCIsIm90cCIsImV4cGlyZXNBdCIsIkRhdGUiLCJub3ciLCJvVFBDb2RlIiwidXBkYXRlTWFueSIsInB1cnBvc2UiLCJ1c2VkIiwiZGF0YSIsImNyZWF0ZSIsImNvZGUiLCJlbWFpbEVyciIsImNvbnNvbGUiLCJzdGVwIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/login/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth.ts":
/*!*********************!*\
  !*** ./lib/auth.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createJWT: () => (/* binding */ createJWT),\n/* harmony export */   generateOTP: () => (/* binding */ generateOTP),\n/* harmony export */   hashPassword: () => (/* binding */ hashPassword),\n/* harmony export */   verifyJWT: () => (/* binding */ verifyJWT),\n/* harmony export */   verifyPassword: () => (/* binding */ verifyPassword)\n/* harmony export */ });\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jsonwebtoken */ \"(rsc)/./node_modules/jsonwebtoken/index.js\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst JWT_SECRET = process.env.JWT_SECRET || \"fallback_secret_for_dev\";\nasync function hashPassword(plain) {\n    const salt = await bcryptjs__WEBPACK_IMPORTED_MODULE_0__[\"default\"].genSalt(10);\n    return bcryptjs__WEBPACK_IMPORTED_MODULE_0__[\"default\"].hash(plain, salt);\n}\nasync function verifyPassword(plain, hash) {\n    return bcryptjs__WEBPACK_IMPORTED_MODULE_0__[\"default\"].compare(plain, hash);\n}\nfunction generateOTP() {\n    // Generate a random 6-digit number\n    return Math.floor(100000 + Math.random() * 900000).toString();\n}\nfunction createJWT(payload, expiresIn = \"7d\") {\n    return jsonwebtoken__WEBPACK_IMPORTED_MODULE_1___default().sign(payload, JWT_SECRET, {\n        expiresIn: expiresIn\n    });\n}\nfunction verifyJWT(token) {\n    try {\n        return jsonwebtoken__WEBPACK_IMPORTED_MODULE_1___default().verify(token, JWT_SECRET);\n    } catch (error) {\n        return null;\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXV0aC50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUE4QjtBQUNDO0FBRS9CLE1BQU1FLGFBQWFDLFFBQVFDLEdBQUcsQ0FBQ0YsVUFBVSxJQUFJO0FBRXRDLGVBQWVHLGFBQWFDLEtBQWE7SUFDOUMsTUFBTUMsT0FBTyxNQUFNUCx3REFBYyxDQUFDO0lBQ2xDLE9BQU9BLHFEQUFXLENBQUNNLE9BQU9DO0FBQzVCO0FBRU8sZUFBZUcsZUFBZUosS0FBYSxFQUFFRyxJQUFZO0lBQzlELE9BQU9ULHdEQUFjLENBQUNNLE9BQU9HO0FBQy9CO0FBRU8sU0FBU0c7SUFDZCxtQ0FBbUM7SUFDbkMsT0FBT0MsS0FBS0MsS0FBSyxDQUFDLFNBQVNELEtBQUtFLE1BQU0sS0FBSyxRQUFRQyxRQUFRO0FBQzdEO0FBRU8sU0FBU0MsVUFBVUMsT0FBZSxFQUFFQyxZQUFvQixJQUFJO0lBQ2pFLE9BQU9sQix3REFBUSxDQUFDaUIsU0FBU2hCLFlBQVk7UUFBRWlCLFdBQVdBO0lBQWlCO0FBQ3JFO0FBRU8sU0FBU0UsVUFBVUMsS0FBYTtJQUNyQyxJQUFJO1FBQ0YsT0FBT3JCLDBEQUFVLENBQUNxQixPQUFPcEI7SUFDM0IsRUFBRSxPQUFPc0IsT0FBTztRQUNkLE9BQU87SUFDVDtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaHJpcC1mcm9udGVuZC8uL2xpYi9hdXRoLnRzP2JmN2UiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJjcnlwdCBmcm9tIFwiYmNyeXB0anNcIjtcbmltcG9ydCBqd3QgZnJvbSBcImpzb253ZWJ0b2tlblwiO1xuXG5jb25zdCBKV1RfU0VDUkVUID0gcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCB8fCBcImZhbGxiYWNrX3NlY3JldF9mb3JfZGV2XCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYXNoUGFzc3dvcmQocGxhaW46IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHNhbHQgPSBhd2FpdCBiY3J5cHQuZ2VuU2FsdCgxMCk7XG4gIHJldHVybiBiY3J5cHQuaGFzaChwbGFpbiwgc2FsdCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlQYXNzd29yZChwbGFpbjogc3RyaW5nLCBoYXNoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgcmV0dXJuIGJjcnlwdC5jb21wYXJlKHBsYWluLCBoYXNoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlT1RQKCk6IHN0cmluZyB7XG4gIC8vIEdlbmVyYXRlIGEgcmFuZG9tIDYtZGlnaXQgbnVtYmVyXG4gIHJldHVybiBNYXRoLmZsb29yKDEwMDAwMCArIE1hdGgucmFuZG9tKCkgKiA5MDAwMDApLnRvU3RyaW5nKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVKV1QocGF5bG9hZDogb2JqZWN0LCBleHBpcmVzSW46IHN0cmluZyA9IFwiN2RcIik6IHN0cmluZyB7XG4gIHJldHVybiBqd3Quc2lnbihwYXlsb2FkLCBKV1RfU0VDUkVULCB7IGV4cGlyZXNJbjogZXhwaXJlc0luIGFzIGFueSB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZlcmlmeUpXVCh0b2tlbjogc3RyaW5nKTogYW55IHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGp3dC52ZXJpZnkodG9rZW4sIEpXVF9TRUNSRVQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXSwibmFtZXMiOlsiYmNyeXB0Iiwiand0IiwiSldUX1NFQ1JFVCIsInByb2Nlc3MiLCJlbnYiLCJoYXNoUGFzc3dvcmQiLCJwbGFpbiIsInNhbHQiLCJnZW5TYWx0IiwiaGFzaCIsInZlcmlmeVBhc3N3b3JkIiwiY29tcGFyZSIsImdlbmVyYXRlT1RQIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwidG9TdHJpbmciLCJjcmVhdGVKV1QiLCJwYXlsb2FkIiwiZXhwaXJlc0luIiwic2lnbiIsInZlcmlmeUpXVCIsInRva2VuIiwidmVyaWZ5IiwiZXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./lib/db.ts":
/*!*******************!*\
  !*** ./lib/db.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst prismaClientSingleton = ()=>{\n    return new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\n};\nconst prisma = globalThis.prismaGlobal ?? prismaClientSingleton();\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\nif (true) globalThis.prismaGlobal = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZGIudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQThDO0FBRTlDLE1BQU1DLHdCQUF3QjtJQUM1QixPQUFPLElBQUlELHdEQUFZQTtBQUN6QjtBQU1BLE1BQU1FLFNBQVNDLFdBQVdDLFlBQVksSUFBSUg7QUFFMUMsaUVBQWVDLE1BQU1BLEVBQUM7QUFFdEIsSUFBSUcsSUFBeUIsRUFBY0YsV0FBV0MsWUFBWSxHQUFHRiIsInNvdXJjZXMiOlsid2VicGFjazovL2hyaXAtZnJvbnRlbmQvLi9saWIvZGIudHM/MWRmMCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5cbmNvbnN0IHByaXNtYUNsaWVudFNpbmdsZXRvbiA9ICgpID0+IHtcbiAgcmV0dXJuIG5ldyBQcmlzbWFDbGllbnQoKTtcbn07XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgdmFyIHByaXNtYUdsb2JhbDogdW5kZWZpbmVkIHwgUmV0dXJuVHlwZTx0eXBlb2YgcHJpc21hQ2xpZW50U2luZ2xldG9uPjtcbn1cblxuY29uc3QgcHJpc21hID0gZ2xvYmFsVGhpcy5wcmlzbWFHbG9iYWwgPz8gcHJpc21hQ2xpZW50U2luZ2xldG9uKCk7XG5cbmV4cG9ydCBkZWZhdWx0IHByaXNtYTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIGdsb2JhbFRoaXMucHJpc21hR2xvYmFsID0gcHJpc21hO1xuIl0sIm5hbWVzIjpbIlByaXNtYUNsaWVudCIsInByaXNtYUNsaWVudFNpbmdsZXRvbiIsInByaXNtYSIsImdsb2JhbFRoaXMiLCJwcmlzbWFHbG9iYWwiLCJwcm9jZXNzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/db.ts\n");

/***/ }),

/***/ "(rsc)/./lib/email.ts":
/*!**********************!*\
  !*** ./lib/email.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   sendApprovalEmail: () => (/* binding */ sendApprovalEmail),\n/* harmony export */   sendOTPEmail: () => (/* binding */ sendOTPEmail)\n/* harmony export */ });\n/* harmony import */ var nodemailer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nodemailer */ \"(rsc)/./node_modules/nodemailer/lib/nodemailer.js\");\n\nconst transporter = nodemailer__WEBPACK_IMPORTED_MODULE_0__.createTransport({\n    host: process.env.SMTP_HOST || \"smtp.gmail.com\",\n    port: parseInt(process.env.SMTP_PORT || \"587\", 10),\n    secure: process.env.SMTP_USE_TLS === \"false\",\n    auth: {\n        user: process.env.SMTP_USERNAME,\n        pass: process.env.SMTP_PASSWORD\n    },\n    connectionTimeout: 5000,\n    socketTimeout: 5000,\n    greetingTimeout: 5000\n});\nconst getFromStr = ()=>`HRIP Security <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME}>`;\nasync function sendOTPEmail(to, code, purpose) {\n    const isEmployee = purpose === \"employee_signup\";\n    const subject = isEmployee ? \"Verify your HRIP Employee Account\" : \"Verify your HRIP Analyst Account\";\n    const html = `\n    <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #081019; color: #ffffff; padding: 40px; border-radius: 8px;\">\n      <h2 style=\"color: #d4b471;\">HRIP Platform</h2>\n      <p style=\"font-size: 16px; color: #e2e8f0;\">Your verification code is:</p>\n      <div style=\"background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;\">\n        <span style=\"font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #8dd0c2;\">${code}</span>\n      </div>\n      <p style=\"font-size: 14px; color: #94a3b8;\">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>\n    </div>\n  `;\n    try {\n        if (process.env.SMTP_ENABLED === \"false\" || \"development\" === \"test\") {\n            console.log(`[Email Mock] Sending OTP to ${to}: ${code} (${purpose})`);\n            return;\n        }\n        await transporter.sendMail({\n            from: getFromStr(),\n            to: to,\n            subject: subject,\n            html: html\n        });\n    } catch (error) {\n        console.error(\"Nodemailer API error:\", error);\n        throw new Error(`SMTP error: ${error.message}`);\n    }\n}\nasync function sendApprovalEmail(to, type, action) {\n    const isApproved = action === \"approve\";\n    const subject = isApproved ? `Your HRIP ${type === \"employee\" ? \"Employee\" : \"Analyst\"} Account is Approved` : `Your HRIP ${type === \"employee\" ? \"Employee\" : \"Analyst\"} Account was Denied`;\n    const html = `\n    <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #081019; color: #ffffff; padding: 40px; border-radius: 8px;\">\n      <h2 style=\"color: #d4b471;\">HRIP Platform</h2>\n      <p style=\"font-size: 16px; color: #e2e8f0;\">\n        ${isApproved ? `Good news! Your ${type} account has been approved by a senior analyst. You can now log in to the platform.` : `We're sorry, but your ${type} account request has been denied. Please contact your administrator for more details.`}\n      </p>\n    </div>\n  `;\n    try {\n        if (process.env.SMTP_ENABLED === \"false\" || \"development\" === \"test\") {\n            console.log(`[Email Mock] Sending approval email to ${to}: type=${type}, action=${action}`);\n            return;\n        }\n        await transporter.sendMail({\n            from: getFromStr(),\n            to: to,\n            subject: subject,\n            html: html\n        });\n    } catch (error) {\n        console.error(\"Nodemailer API error:\", error);\n        throw new Error(`SMTP error: ${error.message}`);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZW1haWwudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQW9DO0FBRXBDLE1BQU1DLGNBQWNELHVEQUEwQixDQUFDO0lBQzdDRyxNQUFNQyxRQUFRQyxHQUFHLENBQUNDLFNBQVMsSUFBSTtJQUMvQkMsTUFBTUMsU0FBU0osUUFBUUMsR0FBRyxDQUFDSSxTQUFTLElBQUksT0FBTztJQUMvQ0MsUUFBUU4sUUFBUUMsR0FBRyxDQUFDTSxZQUFZLEtBQUs7SUFDckNDLE1BQU07UUFDSkMsTUFBTVQsUUFBUUMsR0FBRyxDQUFDUyxhQUFhO1FBQy9CQyxNQUFNWCxRQUFRQyxHQUFHLENBQUNXLGFBQWE7SUFDakM7SUFDQUMsbUJBQW1CO0lBQ25CQyxlQUFlO0lBQ2ZDLGlCQUFpQjtBQUNuQjtBQUVBLE1BQU1DLGFBQWEsSUFBTSxDQUFDLGVBQWUsRUFBRWhCLFFBQVFDLEdBQUcsQ0FBQ2dCLGVBQWUsSUFBSWpCLFFBQVFDLEdBQUcsQ0FBQ1MsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUUvRixlQUFlUSxhQUFhQyxFQUFVLEVBQUVDLElBQVksRUFBRUMsT0FBZTtJQUMxRSxNQUFNQyxhQUFhRCxZQUFZO0lBRS9CLE1BQU1FLFVBQVVELGFBQ1osc0NBQ0E7SUFFSixNQUFNRSxPQUFPLENBQUM7Ozs7OytGQUsrRSxFQUFFSixLQUFLOzs7O0VBSXBHLENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSXBCLFFBQVFDLEdBQUcsQ0FBQ3dCLFlBQVksS0FBSyxXQUFXekIsa0JBQXlCLFFBQVE7WUFDM0UwQixRQUFRQyxHQUFHLENBQUMsQ0FBQyw0QkFBNEIsRUFBRVIsR0FBRyxFQUFFLEVBQUVDLEtBQUssRUFBRSxFQUFFQyxRQUFRLENBQUMsQ0FBQztZQUNyRTtRQUNGO1FBQ0EsTUFBTXhCLFlBQVkrQixRQUFRLENBQUM7WUFDekJDLE1BQU1iO1lBQ05HLElBQUlBO1lBQ0pJLFNBQVNBO1lBQ1RDLE1BQU1BO1FBQ1I7SUFDRixFQUFFLE9BQU9NLE9BQVk7UUFDbkJKLFFBQVFJLEtBQUssQ0FBQyx5QkFBeUJBO1FBQ3ZDLE1BQU0sSUFBSUMsTUFBTSxDQUFDLFlBQVksRUFBRUQsTUFBTUUsT0FBTyxDQUFDLENBQUM7SUFDaEQ7QUFDRjtBQUVPLGVBQWVDLGtCQUFrQmQsRUFBVSxFQUFFZSxJQUE0QixFQUFFQyxNQUEwQjtJQUMxRyxNQUFNQyxhQUFhRCxXQUFXO0lBQzlCLE1BQU1aLFVBQVVhLGFBQ1osQ0FBQyxVQUFVLEVBQUVGLFNBQVMsYUFBYSxhQUFhLFVBQVUsb0JBQW9CLENBQUMsR0FDL0UsQ0FBQyxVQUFVLEVBQUVBLFNBQVMsYUFBYSxhQUFhLFVBQVUsbUJBQW1CLENBQUM7SUFFbEYsTUFBTVYsT0FBTyxDQUFDOzs7O1FBSVIsRUFBRVksYUFDRSxDQUFDLGdCQUFnQixFQUFFRixLQUFLLG1GQUFtRixDQUFDLEdBQzVHLENBQUMsc0JBQXNCLEVBQUVBLEtBQUsscUZBQXFGLENBQUMsQ0FBQzs7O0VBRy9ILENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSWxDLFFBQVFDLEdBQUcsQ0FBQ3dCLFlBQVksS0FBSyxXQUFXekIsa0JBQXlCLFFBQVE7WUFDM0UwQixRQUFRQyxHQUFHLENBQUMsQ0FBQyx1Q0FBdUMsRUFBRVIsR0FBRyxPQUFPLEVBQUVlLEtBQUssU0FBUyxFQUFFQyxPQUFPLENBQUM7WUFDMUY7UUFDRjtRQUNBLE1BQU10QyxZQUFZK0IsUUFBUSxDQUFDO1lBQ3pCQyxNQUFNYjtZQUNORyxJQUFJQTtZQUNKSSxTQUFTQTtZQUNUQyxNQUFNQTtRQUNSO0lBQ0YsRUFBRSxPQUFPTSxPQUFZO1FBQ25CSixRQUFRSSxLQUFLLENBQUMseUJBQXlCQTtRQUN2QyxNQUFNLElBQUlDLE1BQU0sQ0FBQyxZQUFZLEVBQUVELE1BQU1FLE9BQU8sQ0FBQyxDQUFDO0lBQ2hEO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ocmlwLWZyb250ZW5kLy4vbGliL2VtYWlsLnRzPzgyODEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG5vZGVtYWlsZXIgZnJvbSBcIm5vZGVtYWlsZXJcIjtcblxuY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XG4gIGhvc3Q6IHByb2Nlc3MuZW52LlNNVFBfSE9TVCB8fCBcInNtdHAuZ21haWwuY29tXCIsXG4gIHBvcnQ6IHBhcnNlSW50KHByb2Nlc3MuZW52LlNNVFBfUE9SVCB8fCBcIjU4N1wiLCAxMCksXG4gIHNlY3VyZTogcHJvY2Vzcy5lbnYuU01UUF9VU0VfVExTID09PSBcImZhbHNlXCIsIC8vIHRydWUgZm9yIDQ2NSwgZmFsc2UgZm9yIG90aGVyIHBvcnRzXG4gIGF1dGg6IHtcbiAgICB1c2VyOiBwcm9jZXNzLmVudi5TTVRQX1VTRVJOQU1FLFxuICAgIHBhc3M6IHByb2Nlc3MuZW52LlNNVFBfUEFTU1dPUkQsXG4gIH0sXG4gIGNvbm5lY3Rpb25UaW1lb3V0OiA1MDAwLFxuICBzb2NrZXRUaW1lb3V0OiA1MDAwLFxuICBncmVldGluZ1RpbWVvdXQ6IDUwMDAsXG59KTtcblxuY29uc3QgZ2V0RnJvbVN0ciA9ICgpID0+IGBIUklQIFNlY3VyaXR5IDwke3Byb2Nlc3MuZW52LlNNVFBfRlJPTV9FTUFJTCB8fCBwcm9jZXNzLmVudi5TTVRQX1VTRVJOQU1FfT5gO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZE9UUEVtYWlsKHRvOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgcHVycG9zZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGlzRW1wbG95ZWUgPSBwdXJwb3NlID09PSBcImVtcGxveWVlX3NpZ251cFwiO1xuICBcbiAgY29uc3Qgc3ViamVjdCA9IGlzRW1wbG95ZWUgXG4gICAgPyBcIlZlcmlmeSB5b3VyIEhSSVAgRW1wbG95ZWUgQWNjb3VudFwiIFxuICAgIDogXCJWZXJpZnkgeW91ciBIUklQIEFuYWx5c3QgQWNjb3VudFwiO1xuXG4gIGNvbnN0IGh0bWwgPSBgXG4gICAgPGRpdiBzdHlsZT1cImZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87IGJhY2tncm91bmQtY29sb3I6ICMwODEwMTk7IGNvbG9yOiAjZmZmZmZmOyBwYWRkaW5nOiA0MHB4OyBib3JkZXItcmFkaXVzOiA4cHg7XCI+XG4gICAgICA8aDIgc3R5bGU9XCJjb2xvcjogI2Q0YjQ3MTtcIj5IUklQIFBsYXRmb3JtPC9oMj5cbiAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxNnB4OyBjb2xvcjogI2UyZThmMDtcIj5Zb3VyIHZlcmlmaWNhdGlvbiBjb2RlIGlzOjwvcD5cbiAgICAgIDxkaXYgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjMWUyOTNiOyBwYWRkaW5nOiAyMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDhweDsgbWFyZ2luOiAyNHB4IDA7XCI+XG4gICAgICAgIDxzcGFuIHN0eWxlPVwiZm9udC1zaXplOiAzMnB4OyBmb250LXdlaWdodDogYm9sZDsgbGV0dGVyLXNwYWNpbmc6IDRweDsgY29sb3I6ICM4ZGQwYzI7XCI+JHtjb2RlfTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHAgc3R5bGU9XCJmb250LXNpemU6IDE0cHg7IGNvbG9yOiAjOTRhM2I4O1wiPlRoaXMgY29kZSB3aWxsIGV4cGlyZSBpbiAxMCBtaW51dGVzLiBJZiB5b3UgZGlkIG5vdCByZXF1ZXN0IHRoaXMsIHBsZWFzZSBpZ25vcmUgdGhpcyBlbWFpbC48L3A+XG4gICAgPC9kaXY+XG4gIGA7XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuU01UUF9FTkFCTEVEID09PSBcImZhbHNlXCIgfHwgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwidGVzdFwiKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW0VtYWlsIE1vY2tdIFNlbmRpbmcgT1RQIHRvICR7dG99OiAke2NvZGV9ICgke3B1cnBvc2V9KWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbCh7XG4gICAgICBmcm9tOiBnZXRGcm9tU3RyKCksXG4gICAgICB0bzogdG8sXG4gICAgICBzdWJqZWN0OiBzdWJqZWN0LFxuICAgICAgaHRtbDogaHRtbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJOb2RlbWFpbGVyIEFQSSBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHRocm93IG5ldyBFcnJvcihgU01UUCBlcnJvcjogJHtlcnJvci5tZXNzYWdlfWApO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kQXBwcm92YWxFbWFpbCh0bzogc3RyaW5nLCB0eXBlOiBcImVtcGxveWVlXCIgfCBcImFuYWx5c3RcIiwgYWN0aW9uOiBcImFwcHJvdmVcIiB8IFwiZGVueVwiKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGlzQXBwcm92ZWQgPSBhY3Rpb24gPT09IFwiYXBwcm92ZVwiO1xuICBjb25zdCBzdWJqZWN0ID0gaXNBcHByb3ZlZCBcbiAgICA/IGBZb3VyIEhSSVAgJHt0eXBlID09PSBcImVtcGxveWVlXCIgPyBcIkVtcGxveWVlXCIgOiBcIkFuYWx5c3RcIn0gQWNjb3VudCBpcyBBcHByb3ZlZGAgXG4gICAgOiBgWW91ciBIUklQICR7dHlwZSA9PT0gXCJlbXBsb3llZVwiID8gXCJFbXBsb3llZVwiIDogXCJBbmFseXN0XCJ9IEFjY291bnQgd2FzIERlbmllZGA7XG5cbiAgY29uc3QgaHRtbCA9IGBcbiAgICA8ZGl2IHN0eWxlPVwiZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBtYXgtd2lkdGg6IDYwMHB4OyBtYXJnaW46IDAgYXV0bzsgYmFja2dyb3VuZC1jb2xvcjogIzA4MTAxOTsgY29sb3I6ICNmZmZmZmY7IHBhZGRpbmc6IDQwcHg7IGJvcmRlci1yYWRpdXM6IDhweDtcIj5cbiAgICAgIDxoMiBzdHlsZT1cImNvbG9yOiAjZDRiNDcxO1wiPkhSSVAgUGxhdGZvcm08L2gyPlxuICAgICAgPHAgc3R5bGU9XCJmb250LXNpemU6IDE2cHg7IGNvbG9yOiAjZTJlOGYwO1wiPlxuICAgICAgICAke2lzQXBwcm92ZWQgXG4gICAgICAgICAgPyBgR29vZCBuZXdzISBZb3VyICR7dHlwZX0gYWNjb3VudCBoYXMgYmVlbiBhcHByb3ZlZCBieSBhIHNlbmlvciBhbmFseXN0LiBZb3UgY2FuIG5vdyBsb2cgaW4gdG8gdGhlIHBsYXRmb3JtLmAgXG4gICAgICAgICAgOiBgV2UncmUgc29ycnksIGJ1dCB5b3VyICR7dHlwZX0gYWNjb3VudCByZXF1ZXN0IGhhcyBiZWVuIGRlbmllZC4gUGxlYXNlIGNvbnRhY3QgeW91ciBhZG1pbmlzdHJhdG9yIGZvciBtb3JlIGRldGFpbHMuYH1cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cbiAgYDtcblxuICB0cnkge1xuICAgIGlmIChwcm9jZXNzLmVudi5TTVRQX0VOQUJMRUQgPT09IFwiZmFsc2VcIiB8fCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJ0ZXN0XCIpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbRW1haWwgTW9ja10gU2VuZGluZyBhcHByb3ZhbCBlbWFpbCB0byAke3RvfTogdHlwZT0ke3R5cGV9LCBhY3Rpb249JHthY3Rpb259YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKHtcbiAgICAgIGZyb206IGdldEZyb21TdHIoKSxcbiAgICAgIHRvOiB0byxcbiAgICAgIHN1YmplY3Q6IHN1YmplY3QsXG4gICAgICBodG1sOiBodG1sLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcihcIk5vZGVtYWlsZXIgQVBJIGVycm9yOlwiLCBlcnJvcik7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTTVRQIGVycm9yOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJub2RlbWFpbGVyIiwidHJhbnNwb3J0ZXIiLCJjcmVhdGVUcmFuc3BvcnQiLCJob3N0IiwicHJvY2VzcyIsImVudiIsIlNNVFBfSE9TVCIsInBvcnQiLCJwYXJzZUludCIsIlNNVFBfUE9SVCIsInNlY3VyZSIsIlNNVFBfVVNFX1RMUyIsImF1dGgiLCJ1c2VyIiwiU01UUF9VU0VSTkFNRSIsInBhc3MiLCJTTVRQX1BBU1NXT1JEIiwiY29ubmVjdGlvblRpbWVvdXQiLCJzb2NrZXRUaW1lb3V0IiwiZ3JlZXRpbmdUaW1lb3V0IiwiZ2V0RnJvbVN0ciIsIlNNVFBfRlJPTV9FTUFJTCIsInNlbmRPVFBFbWFpbCIsInRvIiwiY29kZSIsInB1cnBvc2UiLCJpc0VtcGxveWVlIiwic3ViamVjdCIsImh0bWwiLCJTTVRQX0VOQUJMRUQiLCJjb25zb2xlIiwibG9nIiwic2VuZE1haWwiLCJmcm9tIiwiZXJyb3IiLCJFcnJvciIsIm1lc3NhZ2UiLCJzZW5kQXBwcm92YWxFbWFpbCIsInR5cGUiLCJhY3Rpb24iLCJpc0FwcHJvdmVkIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/email.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/semver","vendor-chunks/bcryptjs","vendor-chunks/jsonwebtoken","vendor-chunks/lodash.includes","vendor-chunks/jws","vendor-chunks/lodash.once","vendor-chunks/jwa","vendor-chunks/lodash.isinteger","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/lodash.isplainobject","vendor-chunks/ms","vendor-chunks/lodash.isstring","vendor-chunks/lodash.isnumber","vendor-chunks/lodash.isboolean","vendor-chunks/safe-buffer","vendor-chunks/buffer-equal-constant-time","vendor-chunks/nodemailer"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crahul%5CDesktop%5Chrip%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();