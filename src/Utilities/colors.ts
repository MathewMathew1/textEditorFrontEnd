import { Color, ColorRGB, ColorHSL } from "../types";

export const parseColor = (color: string): Color => {
    let hex = "";
    let rgb: ColorRGB = {
      r: 0,
      g: 0,
      b: 0
    };
    let hsl: ColorHSL = {
      h: 0,
      s: 0,
      l: 0
    };
  
    if (color.slice(0, 1) === "#") {
      hex = color;
      rgb = hexToRgb(hex);
      hsl = rgbToHsl(rgb);
    } else if (color.slice(0, 3) === "rgb") {
      rgb = getRgb(color);
      hex = rgbToHex(rgb);
      hsl = rgbToHsl(rgb);
    }
  
    return {
      hex,
      rgb,
      hsl
    };
  }
  
export  const hexToRgb = (hex: string) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(result===null) return {r: 0, g: 0, b: 0 }
        
    let newRgbValue = {
        r: parseInt(result[1], 16), 
        g: parseInt(result[2], 16), 
        b: parseInt(result[3], 16)
    }
    return(newRgbValue)
  }

export const componentToHex = (c: number) => {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

export const rgbToHex = (rgb: ColorRGB) => {
    return(`#${componentToHex(rgb.r)}${componentToHex(rgb.r)}${componentToHex(rgb.b)}`)
}

export const rgbToHsl = (color: ColorRGB): ColorHSL => {
    let { r, g, b } = color;
    r /= 255;
    g /= 255;
    b /= 255;
  
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
  
    const h = d
      ? (max === r
          ? (g - b) / d + (g < b ? 6 : 0)
          : max === g
          ? 2 + (b - r) / d
          : 4 + (r - g) / d) * 60
      : 0;
    const s = max ? (d / max) * 100 : 0;
    const l = max * 100;
  
    return { h, s, l };
}

export const getRgb = (color: string): ColorRGB => {
    const matches = /rgb\((\d+),\s?(\d+),\s?(\d+)\)/i.exec(color);
    const r = Number(matches?.[1] ?? 0);
    const g = Number(matches?.[2] ?? 0);
    const b = Number(matches?.[3] ?? 0);
  
    return {
      r,
      g,
      b
    };
}


export const getSaturationCoordinates = (color: Color): [number, number] => {
    const { s, l } = rgbToHsl(color.rgb);

    const x = s;
    const y = 100 - l;

    return [x, y];
}  

export const getHueCoordinates = (color: Color): number => {
    const { h } = color.hsl;

    const x = (h / 360) * 100;

    return x;
}

export const hslToRgb = (color: ColorHSL): ColorRGB => {
    let { h, s, l } = color;
    s /= 100;
    l /= 100;
  
    const i = ~~(h / 60);
    const f = h / 60 - i;
    const p = l * (1 - s);
    const q = l * (1 - s * f);
    const t = l * (1 - s * (1 - f));
    const index = i % 6;
  
    const r = Math.round([l, q, p, p, t, l][index] * 255);
    const g = Math.round([t, l, l, q, p, p][index] * 255);
    const b = Math.round([p, p, t, l, l, q][index] * 255);
  
    return {
      r,
      g,
      b
    };
  }

  export const clamp = (number: number, min: number, max: number): number => {
    let clampedValue =  Math.min(Math.max(number, min), max)
    return clampedValue;
  }

  export const baseHslColor = (hsl: ColorHSL) => {
    let baseHsl = {h: hsl.h, s:100, l: 100}
    const rgb = hslToRgb(baseHsl);
    return rgb
  }

  export const stringToColor = (string: string): string => {
    let hash = 0;
    let i;
  
    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
  
    let color = '#';
  
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.substr(-2);
    }
    /* eslint-enable no-bitwise */
  
    return color;
  }
