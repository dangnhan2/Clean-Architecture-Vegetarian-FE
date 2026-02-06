"use client";

import React from "react";

type JsonElement = string | number | boolean | null | JsonElement[] | { [key: string]: JsonElement };

interface DescriptionRendererProps {
  description: string | JsonElement | null | undefined;
  className?: string;
  maxLength?: number;
}

/**
 * Renders description that can be either a string (HTML) or JsonElement
 * If it's a JsonElement, it extracts HTML content from it
 */
export const DescriptionRenderer: React.FC<DescriptionRendererProps> = ({
  description,
  className = "",
  maxLength,
}) => {
  if (!description) {
    return null;
  }

  // If description is already a string (HTML), render it directly
  if (typeof description === "string") {
    const content = maxLength && description.length > maxLength 
      ? description.substring(0, maxLength) + "..." 
      : description;
    
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // If description is a JsonElement (object), try to extract HTML
  if (typeof description === "object" && description !== null) {
    let htmlContent = "";

    // Try to find HTML content in the object
    // Common Delta format: { ops: [...] } or { html: "..." } or direct HTML string in object
    if (Array.isArray(description)) {
      // If it's an array, try to find HTML in it
      const htmlItem = description.find((item) => typeof item === "string" && item.includes("<"));
      if (htmlItem) {
        htmlContent = htmlItem as string;
      }
    } else if ("html" in description && typeof description.html === "string") {
      htmlContent = description.html;
    } else if ("ops" in description && Array.isArray(description.ops)) {
      // Delta format - convert ops to HTML
      htmlContent = convertDeltaToHtml(description.ops);
    } else if ("delta" in description && typeof description.delta === "object" && description.delta !== null) {
      // Nested delta
      const delta = description.delta as { ops?: any[] };
      if (delta && Array.isArray(delta.ops)) {
        htmlContent = convertDeltaToHtml(delta.ops);
      }
    } else {
      // Try to find any string value that looks like HTML
      const findHtmlInObject = (obj: any): string => {
        if (typeof obj === "string" && obj.includes("<")) {
          return obj;
        }
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const found = findHtmlInObject(item);
            if (found) return found;
          }
        }
        if (typeof obj === "object" && obj !== null) {
          for (const key in obj) {
            const found = findHtmlInObject(obj[key]);
            if (found) return found;
          }
        }
        return "";
      };
      htmlContent = findHtmlInObject(description);
    }

    if (htmlContent) {
      const content = maxLength && htmlContent.length > maxLength 
        ? htmlContent.substring(0, maxLength) + "..." 
        : htmlContent;
      
      return (
        <div
          className={className}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // If no HTML found, try to render as plain text
    const textContent = JSON.stringify(description);
    const displayText = maxLength && textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + "..." 
      : textContent;
    
    return <div className={className}>{displayText}</div>;
  }

  return null;
};

/**
 * Simple Delta to HTML converter
 * This is a basic implementation - for production, consider using quill-delta-to-html
 */
function convertDeltaToHtml(ops: any[]): string {
  let html = "";
  
  for (const op of ops) {
    if (typeof op.insert === "string") {
      let text = op.insert;
      
      // Apply formatting
      if (op.attributes) {
        if (op.attributes.bold) {
          text = `<strong>${text}</strong>`;
        }
        if (op.attributes.italic) {
          text = `<em>${text}</em>`;
        }
        if (op.attributes.underline) {
          text = `<u>${text}</u>`;
        }
        if (op.attributes.strike) {
          text = `<s>${text}</s>`;
        }
        if (op.attributes.link) {
          text = `<a href="${op.attributes.link}">${text}</a>`;
        }
        if (op.attributes.header) {
          const level = op.attributes.header;
          text = `<h${level}>${text}</h${level}>`;
        }
        if (op.attributes.list) {
          const listTag = op.attributes.list === "ordered" ? "ol" : "ul";
          text = `<${listTag}><li>${text}</li></${listTag}>`;
        }
        if (op.attributes.blockquote) {
          text = `<blockquote>${text}</blockquote>`;
        }
      }
      
      html += text;
    } else if (op.insert && typeof op.insert === "object") {
      // Handle embeds (images, etc.)
      if (op.insert.image) {
        html += `<img src="${op.insert.image}" />`;
      }
    }
  }
  
  return html;
}

