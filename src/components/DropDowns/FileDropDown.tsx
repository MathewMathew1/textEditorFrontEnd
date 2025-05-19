import { Folder, Download, Pencil, Delete, Print, File } from "../../svgs/svgs";
import { htmlDocument } from "../../Utilities/html";
import { useEditor } from "../../contexts/UseEditorProvider";
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import { useEffect } from "react";
import { useUser, useUserUpdate } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import DocumentsTemplateModal from "../Modals/DocumentsTemplateModal";
import OpenDocumentsTemplateModal from "../Modals/OpenDocumentsTemplateModal";
import { downloadDocxFile, downLoadText, exportToPDF, printDocument } from "../../Utilities/downloands";
import JSZip from "jszip";

const FileDropdown = ({
  titleInput,
}: {
  titleInput: React.RefObject<HTMLInputElement>;
}) => {
  const userUpdate = useUserUpdate();
  const user = useUser();
  const editorValues = useEditor();
  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible<HTMLDivElement>(false);
  const {
    ref: templatesModalRef,
    isComponentVisible: isTemplatesModalVisible,
    setIsComponentVisible: setIsTemplatesModalVisible,
  } = useComponentVisible<HTMLDivElement>(false);
  const {
    ref: templatesOpenModalRef,
    isComponentVisible: isTemplatesOpenModalVisible,
    setIsComponentVisible: setIsTemplatesOpenModalVisible,
  } = useComponentVisible<HTMLDivElement>(false);
  const navigate = useNavigate();




   const downloadHtmlZipFile = () => {
        const text = htmlDocument(editorValues.textDocument.value)
        const zip = new JSZip();
        zip.file(`${editorValues.title}.html`, text);
        zip.generateAsync({ type: "blob" })
            .then((blob: any) => {
                const a = document.createElement("a");
                a.download = `${editorValues.title}.zip`;
                a.href = URL.createObjectURL(blob);
                a.click();
            });
    }



  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "p") {
        event.preventDefault();
        printDocument(htmlDocument(editorValues.textDocument.value));
      }
    };

    window.addEventListener("keydown", (e) => handleKeyDown(e));

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const createNewDocument = async () => {
    const id = await userUpdate.createNewDocument(
      user.templates[0].template,
      user.templates[0].templateName
    );
    if (!id) return;
    navigate(`/textDocument/${id}`);
  };

  const deleteDocument = () => {
    userUpdate.deleteDocument(editorValues.documentId);
    navigate(`/`);
  };

  return (
    <>
      <div ref={ref} className="dropdown">
        <button
          className="button-div"
          onClick={() => setIsComponentVisible(true)}
        >
          File
        </button>
        {isComponentVisible ? (
          <div
            onClick={() => setIsComponentVisible(false)}
            style={{ minWidth: "300pt" }}
            className="dropdown-content"
          >
            <div className="sidebar">
              <button className="button-div dropdown-option ">
                <div>
                  <File color={false} />
                </div>
                <div className="text-option-dropdown">New</div>
                <div className="right-triangle"></div>
              </button>
              <div
                style={{ minWidth: "250pt" }}
                className="sidebar-content right"
              >
                <button
                  onClick={() => createNewDocument()}
                  className="button-div dropdown-option "
                >
                  <div>
                    <File color={true} />
                  </div>
                  <div className="text-option-dropdown">Empty Document</div>
                </button>
                <button
                  onClick={() => setIsTemplatesModalVisible(true)}
                  className="button-div dropdown-option "
                >
                  <div>
                    <File />
                  </div>
                  <div className="text-option-dropdown">
                    Document from Template
                  </div>
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsTemplatesOpenModalVisible(true)}
              className="button-div dropdown-option"
            >
              <div>
                <Folder />
              </div>
              <div className="text-option-dropdown">Open</div>
            </button>
            <hr></hr>
            <div className="sidebar">
              <button className="button-div dropdown-option ">
                <div>
                  <Download />
                </div>
                <div className="text-option-dropdown">Download</div>
                <div className="right-triangle"></div>
              </button>
              <div
                style={{ minWidth: "250pt" }}
                className="sidebar-content right"
              >
                <button
                  onClick={() => downLoadText(editorValues.markdownInput.current!.textContent!, editorValues.title )}
                  className="button-div dropdown-option "
                >
                  <div className="text-option-dropdown">Plain text (.text)</div>
                </button>
                <button
                  onClick={() => downloadDocxFile(htmlDocument(editorValues.textDocument.value), editorValues.title)}
                  className="button-div dropdown-option "
                >
                  <div className="text-option-dropdown">
                    MicrosoftWord (.docx)
                  </div>
                </button>
                  <button
                  onClick={() => exportToPDF(htmlDocument(editorValues.textDocument.value), editorValues.title)}
                  className="button-div dropdown-option "
                >
                  <div className="text-option-dropdown">
                    Pdf
                  </div>
                </button>
                <button
                  onClick={() => downloadHtmlZipFile()}
                  className="button-div dropdown-option "
                >
                  <div className="text-option-dropdown">
                    Html
                  </div>
                </button>
                
              </div>
            </div>
            <hr></hr>
            <button
              onClick={() => {
                titleInput.current?.focus();
              }}
              className="button-div dropdown-option"
            >
              <div>
                <Pencil />
              </div>
              <div className="text-option-dropdown">Rename</div>
            </button>
            <button
              onClick={() => deleteDocument()}
              className="button-div dropdown-option"
            >
              <div>
                <Delete />
              </div>
              <div className="text-option-dropdown">Delete</div>
            </button>

            <hr></hr>
            <button
              onClick={() => printDocument(editorValues.textDocument.value)}
              className="button-div dropdown-option"
            >
              <div>
                <Print color={false} />
              </div>
              <div className="text-option-dropdown">Print</div>
              <div>Ctrl+P</div>
            </button>
          </div>
        ) : null}
      </div>
      <DocumentsTemplateModal
        isModalOpen={isTemplatesModalVisible}
        setIsModalOpen={setIsTemplatesModalVisible}
        innerRef={templatesModalRef}
      />
      <OpenDocumentsTemplateModal
        isModalOpen={isTemplatesOpenModalVisible}
        setIsModalOpen={setIsTemplatesOpenModalVisible}
        innerRef={templatesOpenModalRef}
      />
    </>
  );
};

export default FileDropdown;
