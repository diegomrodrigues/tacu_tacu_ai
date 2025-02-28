// File: /app/src/App.jsx
import { useState, useEffect } from 'react';
import { askAI } from './langchain';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { $convertToMarkdownString, TRANSFORMERS, $convertFromMarkdownString } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { LinkNode } from '@lexical/link';
import { $getRoot } from 'lexical';
import './App.css';
import ProjectsView from './components/ProjectsView';

function App() {
  const [editorContent, setEditorContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState(null);
  const [isProjectsView, setIsProjectsView] = useState(false);
  const [navigationPath, setNavigationPath] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [projects, setProjects] = useState({
    'Time Series Analysis': {
      sections: {
        '01. Differential Equations': {
          subsections: {
            '01. pth-Order Difference Equations': {
              files: {
                '01. Difference Equation Analysis.md': '# Difference Equation Analysis\n\nKey mathematical concepts...',
                '02. System Stability Analysis.md': '# System Stability Analysis\n\nStability conditions and theorems...',
                '03. Difference Equation Solution.md': '# Difference Equation Solution\n\nSolution methods and approaches...',
                '04. Dynamic Multiplier Equations.md': '# Dynamic Multiplier Equations\n\nAnalysis of multiplier effects...'
              }
            },
            '02. First-Order Difference Equations': {}
          }
        },
        '02. Lag Operators': {
          subsections: {
            '01. First-Order Difference Equations': {
              files: {
                '01. First Order Difference Equation.md': '# First Order Difference Equation\n\nFundamental concepts...',
                '02. Difference Equation Solution.md': '# Difference Equation Solution\n\nSolution techniques...',
                '03. Convergence Stability Condition.md': '# Convergence Stability Condition\n\nAnalysis of conditions...',
                '04. Reescrevendo Equacoes Diferenca.md': '# Reescrevendo Equações Diferença\n\nMétodos alternativos...',
                '05. Algebraic Manipulation of Difference Equations.md': '# Algebraic Manipulation\n\nAdvanced techniques...',
                '06. Expansao Operadores Compostos.md': '# Expansão Operadores Compostos\n\nOperadores e aplicações...',
                '07. Recursive Expression Substitution.md': '# Recursive Expression Substitution\n\nSubstitution methods...'
              }
            },
            '02. Second-Order Difference Equations': {},
            '03. Lag Operators': {}
          }
        }
      }
    }
  });

  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || !selectedFile || navigationPath.length === 0) return;
    
    setLoading(true);
    try {
      // Get current content by traversing the path
      let currentLevel = projects;
      for (const pathItem of navigationPath) {
        if (currentLevel[pathItem]) {
          currentLevel = currentLevel[pathItem];
        } else if (currentLevel.sections && currentLevel.sections[pathItem]) {
          currentLevel = currentLevel.sections[pathItem];
        } else if (currentLevel.subsections && currentLevel.subsections[pathItem]) {
          currentLevel = currentLevel.subsections[pathItem];
        } else {
          throw new Error("Invalid navigation path");
        }
      }
      
      const currentContent = currentLevel.files[selectedFile];
      const response = await askAI(`${userQuestion}\n\nCurrent content:\n${currentContent}`);
      
      // Update projects with new content by creating a deep copy and modifying it
      const updateNestedContent = (obj, path, fileName, newContent) => {
        if (path.length === 0) {
          // We've reached the target level, update the file
          return {
            ...obj,
            files: {
              ...obj.files,
              [fileName]: newContent
            }
          };
        }
        
        const currentPath = path[0];
        const remainingPath = path.slice(1);
        
        if (obj[currentPath]) {
          return {
            ...obj,
            [currentPath]: updateNestedContent(obj[currentPath], remainingPath, fileName, newContent)
          };
        } else if (obj.sections && obj.sections[currentPath]) {
          return {
            ...obj,
            sections: {
              ...obj.sections,
              [currentPath]: updateNestedContent(obj.sections[currentPath], remainingPath, fileName, newContent)
            }
          };
        } else if (obj.subsections && obj.subsections[currentPath]) {
          return {
            ...obj,
            subsections: {
              ...obj.subsections,
              [currentPath]: updateNestedContent(obj.subsections[currentPath], remainingPath, fileName, newContent)
            }
          };
        }
        
        return obj;
      };
      
      setProjects(prev => updateNestedContent(prev, navigationPath, selectedFile, response));

      // Update editor with new content
      if (editorRef) {
        editorRef.update(() => {
          $convertFromMarkdownString(response, TRANSFORMERS);
        });
      }
      
      setUserQuestion('');
    } catch (error) {
      console.error("Error asking AI:", error);
      alert("Error occurred while getting response");
    } finally {
      setLoading(false);
    }
  };

  function EditorRefPlugin() {
    const [editor] = useLexicalComposerContext();
    
    useEffect(() => {
      setEditorRef(editor);
    }, [editor]);
    
    return null;
  }

  function OnChangePlugin({ onChange, onMarkdownChange }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          const plainText = editor.getEditorState().read(() => editor._rootElement?.textContent || '');
          onChange(plainText);
          
          // Convert to markdown
          const markdown = $convertToMarkdownString(TRANSFORMERS);
          onMarkdownChange(markdown);
        });
      });
    }, [editor, onChange, onMarkdownChange]);
    return null;
  }

  const initialConfig = {
    namespace: 'MyEditor',
    onError: (error) => console.error(error),
    theme: {
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListItemNode,
      ListNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      LinkNode
    ]
  };

  // Handle Enter key press in the text input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAskQuestion();
    }
  };

  const handleProjectsToggle = () => {
    setIsProjectsView(!isProjectsView);
    setNavigationPath([]);
    setSelectedFile(null);
  };

  const handleProjectsBack = () => {
    if (navigationPath.length > 0) {
      setNavigationPath(prev => prev.slice(0, -1));
    } else {
      setIsProjectsView(false);
    }
  };

  return (
    <div id="root" className="fullscreen-app">
      <div className="editor-workspace">
        <div className="editor-container">
          <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-inner">
              {isProjectsView ? (
                <ProjectsView 
                  projects={projects}
                  onSelectContent={() => setIsProjectsView(false)}
                  onBack={handleProjectsBack}
                  navigationPath={navigationPath}
                  setNavigationPath={setNavigationPath}
                  setSelectedFile={setSelectedFile}
                />
              ) : (
                <>
                  <RichTextPlugin
                    contentEditable={<ContentEditable className="editor-input" />}
                    placeholder={<div className="editor-placeholder">Start typing markdown here...</div>}
                  />
                  <HistoryPlugin />
                  <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                </>
              )}
              <OnChangePlugin 
                onChange={setEditorContent} 
                onMarkdownChange={setMarkdownContent} 
              />
              <EditorRefPlugin />
            </div>
          </LexicalComposer>
        </div>
      </div>

      <div className="input-container">
        <input
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="question-input"
          disabled={loading || !selectedFile || navigationPath.length === 0}
        />
        <button 
          onClick={handleProjectsToggle} 
          className="ask-button"
        >
          {isProjectsView ? "Close Projects" : "Projects"}
        </button>
        <button 
          onClick={handleAskQuestion} 
          disabled={loading || !userQuestion.trim() || !selectedFile || navigationPath.length === 0}
          className="ask-button"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>
    </div>
  );
}

export default App;
