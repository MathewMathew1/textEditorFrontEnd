let BASE_API_ROUTES_URL: string
let BASE_ROUTE_URL: string
let SITE_ROUTE_URL: string

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    BASE_API_ROUTES_URL = "http://localhost:3000/api/v1"
    SITE_ROUTE_URL = "http://localhost:3000"
    BASE_ROUTE_URL = "http://localhost:3000"
}
else{
    BASE_API_ROUTES_URL = "https://texteditor-production-eaf9.up.railway.app/api/v1"
    SITE_ROUTE_URL = "https://shopik.onrender.com"
    BASE_ROUTE_URL = "https://texteditor-production-eaf9.up.railway.app"
}

const googleSignUpRoute = BASE_API_ROUTES_URL + "/user/google/auth"
const usernameLoginRoute = BASE_API_ROUTES_URL + "/user/username/login"
const usernameSignupRoute = BASE_API_ROUTES_URL + "/user/username/signUp"
const emailLoginRoute = BASE_API_ROUTES_URL + "/user/email/login"
const emailSignupRoute = BASE_API_ROUTES_URL + "/user/email/signUp"
const userDataRoute = BASE_API_ROUTES_URL + "/user/data"
const textDocumentTemplatesRoute = BASE_API_ROUTES_URL + "/textDocument/templates"
const titleRoute = BASE_API_ROUTES_URL + "/textDocument/title/id/"
const imageRoute = BASE_API_ROUTES_URL + "/textDocument/image"
const textDocumentsRoute = BASE_API_ROUTES_URL + "/textDocument"
const getTextDocumentsRoute = BASE_API_ROUTES_URL + "/textDocument/id/"
const textDocumentPurifyRoute = BASE_API_ROUTES_URL + "/textDocument/purify"
const changeTitleRoute = BASE_API_ROUTES_URL + "/textDocument/title/id/"
const changeTextRoute = BASE_API_ROUTES_URL + "/textDocument/text/id/"
const deleteCookieRoute = BASE_API_ROUTES_URL + "/user/cookie"
const healthCheckRoute = BASE_ROUTE_URL + "/healthCheck"

export {googleSignUpRoute, usernameLoginRoute, usernameSignupRoute, emailLoginRoute, titleRoute, textDocumentsRoute, 
        changeTitleRoute, changeTextRoute, deleteCookieRoute,healthCheckRoute,
     getTextDocumentsRoute, emailSignupRoute, userDataRoute, textDocumentTemplatesRoute, imageRoute, textDocumentPurifyRoute}