export enum Fonts {
  AmaticSc = "Amatic Sc",
  Arial = "Arial",
  Caveat = "Caveat",
  Comfortaa = "Comfortaa",
  ComicSansMs = "Comic Sans MS",
  CourierNew = "Courier New",
  EbGaromand = "EB Garomand",
  Georgia = "Georgia",
  Helvetica = "Helvetica",
  Impact = "Impact",
  Lexend = "Lexend",
  Lobster = "Lobster",
  TimesNewRoman = "Times New Roman",
  Pacifico = "Pacifico",
  Roboto = "Roboto",
  RobotoMono = "Roboto Mono",
  RobotoSerif = "Roboto Serif",
  TrebuchetMs = "Trebuchet Ms",
  Verdana = 'Verdana',
}

export interface Color {
  hex: string;
  rgb: ColorRGB;
  hsl: ColorHSL;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export type userData = {
  _id: string;
  username?: string;
  email?: string;
  google?: {
      id: string;
  }
  createdAt: string;
} 

export type ImageResizeInfo = {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
    image: null|HTMLImageElement
    maxWidth: number
    maxHeight: number
    rotateDegree: number,
    centerX: number, 
    centerY: number
}

export type TextDocument = {
  _id: string, 
  lastUpdatedAt: string, 
  text: string,
  title: string
}

export enum severityColors {
  error = "rgb(240, 56, 19)",
  warning = "rgb(247, 247, 10)",
  success = "rgb(18, 230, 113)",
}

export type cellResizeInfoType = {
    top: number,
    left: number,
    bottom: number,
    right: number,
    initialWidth: number,
    initialHeight: number,
    maxLeft: number,
    maxBottom: number, 
    maxTop: number
    maxRight: number
    cell?: HTMLTableCellElement
} 

