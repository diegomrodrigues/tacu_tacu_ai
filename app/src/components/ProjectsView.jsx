import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '@lexical/markdown';

export default function ProjectsView({ 
  projects, 
  onSelectContent,
  onBack,
  navigationPath,
  setNavigationPath,
  setSelectedFile
}) {
  const [editor] = useLexicalComposerContext();

  // Get the current folder based on navigation path
  const getCurrentFolder = () => {
    let currentFolder = projects;
    
    // Navigate through the path
    for (const pathItem of navigationPath) {
      if (currentFolder[pathItem]) {
        currentFolder = currentFolder[pathItem];
      } else if (currentFolder.sections && currentFolder.sections[pathItem]) {
        currentFolder = currentFolder.sections[pathItem];
      } else if (currentFolder.subsections && currentFolder.subsections[pathItem]) {
        currentFolder = currentFolder.subsections[pathItem];
      } else {
        return null; // Invalid path
      }
    }
    
    return currentFolder;
  };

  const handleItemClick = (itemName) => {
    const currentFolder = getCurrentFolder();
    
    // Check if it's a file
    if (currentFolder.files && currentFolder.files[itemName]) {
      const content = currentFolder.files[itemName];
      editor.update(() => {
        $convertFromMarkdownString(content, TRANSFORMERS);
      });
      setSelectedFile(itemName);
      onSelectContent();
      return;
    }
    
    // It's a folder, add to navigation path
    setNavigationPath([...navigationPath, itemName]);
  };

  // Render current level
  const renderCurrentLevel = () => {
    const currentFolder = getCurrentFolder();
    if (!currentFolder) return <div>Error: Invalid path</div>;
    
    // List items in the current folder
    let items = [];
    
    // Add projects at root level
    if (navigationPath.length === 0) {
      items = Object.keys(projects).map(name => ({
        name,
        type: 'folder'
      }));
    } 
    // Add sections/subsections/files from the current level
    else {
      // Add regular items
      if (currentFolder.sections) {
        items = [...items, ...Object.keys(currentFolder.sections).map(name => ({
          name,
          type: 'folder'
        }))];
      }
      
      if (currentFolder.subsections) {
        items = [...items, ...Object.keys(currentFolder.subsections).map(name => ({
          name,
          type: 'folder'
        }))];
      }
      
      // Add files
      if (currentFolder.files) {
        items = [...items, ...Object.keys(currentFolder.files).map(name => ({
          name,
          type: 'file'
        }))];
      }
    }
    
    return (
      <ul>
        {items.map(item => (
          <li key={item.name}>
            <button
              className={item.type === 'file' ? "file-link" : "subsection-link"}
              onClick={() => handleItemClick(item.name)}
            >
              <span className={item.type === 'file' ? "file-icon" : "folder-icon"}>
                {item.type === 'file' ? '📄' : '📁'}
              </span> {item.name}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  // Generate title for current view
  const getViewTitle = () => {
    if (navigationPath.length === 0) {
      return "My Projects";
    }
    return navigationPath[navigationPath.length - 1];
  };

  return (
    <div className="projects-container">
      {navigationPath.length > 0 && (
        <button className="back-button" onClick={onBack}>← Back</button>
      )}
      
      <div className="navigation-breadcrumbs">
        {navigationPath.length > 0 && (
          <div className="breadcrumbs">
            {navigationPath.map((item, index) => (
              <span key={index} className="breadcrumb-item">
                {index > 0 && <span className="breadcrumb-separator"> / </span>}
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <h2>{getViewTitle()}</h2>
      {renderCurrentLevel()}
    </div>
  );
}