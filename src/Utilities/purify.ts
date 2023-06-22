import { textDocumentPurifyRoute } from "../routes";

const purifyDocument = async (text: string) => {
    try {
        const response = await fetch(textDocumentPurifyRoute, {
          method: 'POST', // Adjust the HTTP method if needed
          headers: {
            'Content-Type': 'application/json', // Adjust the content type if needed
          },
          body: JSON.stringify({ text }), // Adjust the request body if needed
        });
    
        if (response.ok) {
          const responseData = await response.text();
          return responseData;
        } else {
          throw new Error('Request failed');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        return undefined;
      }
}

export {purifyDocument}