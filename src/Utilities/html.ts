import { mainFonts } from "./fonts"

const htmlDocument = (htmlValue: string) => {
    const document = `<html>
    <head>${mainFonts()}<style>
    * {
      padding: 0;
      margin-right: 0;
      margin-left: 0;
    }

    div{
      box-sizing: border-box;
      width: 210mm;
      background-color: pink;
      word-break: break-all;
      white-space: pre-wrap;
    }
  </style></head>
        <body >
        <div style="">
          ${htmlValue}
        </div>
        </body
    </html>`

    return document
}

export {htmlDocument}