import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import './MDEditor.css';

interface MDEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  disabled?: boolean;
  className?: string;
}

/**
 * Современный Markdown редактор с WYSIWYG возможностями
 * Совместим с React 18, интегрирован с дизайн-системой проекта
 */
const CustomMDEditor: React.FC<MDEditorProps> = ({
  value,
  onChange,
  placeholder = 'Начните писать содержимое поста...',
  height = 400,
  disabled = false,
  className = ''
}) => {
  const handleChange = (val?: string) => {
    onChange(val || '');
  };

  return (
    <div 
      className={`md-editor-wrapper ${className}`}
      data-color-mode="light"
    >
      <MDEditor
        value={value}
        onChange={handleChange}
        preview="edit"
        hideToolbar={disabled}
        visibleDragbar={false}
        textareaProps={{
          placeholder,
          disabled,
          style: {
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#111827',
            backgroundColor: '#ffffff',
          }
        }}
        height={typeof height === 'number' ? height : parseInt(height.toString())}
        data-color-mode="light"
      />
    </div>
  );
};

export default CustomMDEditor; 