import { mainFonts } from "./fonts";
import html2pdf from "html2pdf.js";

export const getPrintStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css?family=Roboto');

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
        font-size: 18pt;
        page-break-before: always;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.2;
      }

      .page {
        overflow: hidden;
        box-sizing: border-box;
        height: 297mm;
        width: 210mm;
      }

      #non-printable {
        display: none;
      }

      #printable {
        display: block;
      }
    }

    body {
      padding: 0;
      margin: 0;
      font-family: Roboto, sans-serif;
    }
  </style>
`;

export const printDocument = (htmlContent: string) => {
  const printWindow = window.open("", "Print Window", "width=800,height=900");
  const styles = getPrintStyles();

  const fullHtml = `
    <html>
      <head>${styles}</head>
      <body onload="setTimeout(() => window.print(), 500)">
        ${htmlContent}
      </body>
    </html>
  `;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  }
};

export const exportToPDF = (htmlContent: string, title: string) => {
  const container = document.createElement("body");
  container.style.fontFamily = "Arial, sans-serif;";
  container.style.fontSize = "12pt";
  container.style.lineHeight = "1.2";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  html2pdf()
    .set({
      margin: 0,
      filename: "resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save()
    .then(() => {
      document.body.removeChild(container);
    });
};

export async function downloadDocxFile(htmlContent: string, title: string) {
  const styles = getPrintStyles();
  const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'/><title>Export HTML To Doc</title>${mainFonts()} ${styles}
        </head><body>`;
  const postHtml = "</body></html>";
  const html = preHtml + htmlContent + postHtml;

  const blob = new Blob([new Uint8Array(), html], {
    type: "application/msword",
  });

  const filename = `${title}.doc`;

  const downloadLink = document.createElement("a");

  downloadLink.download = filename;
  downloadLink.href = URL.createObjectURL(blob);

  downloadLink.click();
}

export const downLoadText = async (text: string, title: string) => {
  const blob = new Blob([text], { type: "text/plain" });

  const a = document.createElement("a");
  a.download = `${title}.txt`;
  a.href = URL.createObjectURL(blob);

  a.click();
};

export const exportHtmlFile = (
  htmlContent: string,
  fileName = "document.html"
) => {
  const styles = getPrintStyles(); 
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>${styles}</head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
