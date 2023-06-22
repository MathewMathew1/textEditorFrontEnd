import { useEffect } from "react";

const NotFound = () => {
    useEffect(() => {
        document.title = "Document Not Found";
    }, []);

    return (
      <div className="not-found">
        <h2>Document not found</h2>
        <p>Searched text document either doesn't exist or you are not authorized to see it</p>
      </div>
    );
  };

export default NotFound