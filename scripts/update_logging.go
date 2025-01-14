package main

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	// Start from the current directory
	err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip non-Go files and vendor directory
		if !strings.HasSuffix(path, ".go") || strings.Contains(path, "vendor/") {
			return nil
		}

		// Parse the Go file
		fset := token.NewFileSet()
		node, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			fmt.Printf("Error parsing %s: %v\n", path, err)
			return nil
		}

		// Check if the file needs modification
		needsUpdate := false
		hasLoggingImport := false

		// Check imports
		for _, imp := range node.Imports {
			if imp.Path.Value == `"one-api/common"` {
				needsUpdate = true
			}
			if imp.Path.Value == `"one-api/logging"` {
				hasLoggingImport = true
			}
		}

		// Visit all nodes in the AST
		ast.Inspect(node, func(n ast.Node) bool {
			if sel, ok := n.(*ast.SelectorExpr); ok {
				if ident, ok := sel.X.(*ast.Ident); ok {
					if ident.Name == "common" {
						switch sel.Sel.Name {
						case "LogInfo", "LogError", "SysError":
							needsUpdate = true
						}
					}
				}
			}
			return true
		})

		if !needsUpdate {
			return nil
		}

		// Add logging import if needed
		if !hasLoggingImport {
			// Create new import
			newImport := &ast.ImportSpec{
				Path: &ast.BasicLit{
					Kind:  token.STRING,
					Value: `"one-api/logging"`,
				},
			}

			// Add to imports
			if len(node.Imports) == 0 {
				node.Imports = []*ast.ImportSpec{newImport}
			} else {
				node.Imports = append(node.Imports, newImport)
			}
		}

		// Replace common.Log* calls with logging.Log*
		ast.Inspect(node, func(n ast.Node) bool {
			if sel, ok := n.(*ast.SelectorExpr); ok {
				if ident, ok := sel.X.(*ast.Ident); ok {
					if ident.Name == "common" {
						switch sel.Sel.Name {
						case "LogInfo", "LogError", "SysError":
							ident.Name = "logging"
						}
					}
				}
			}
			return true
		})

		// Format the modified AST
		var buf bytes.Buffer
		err = format.Node(&buf, fset, node)
		if err != nil {
			fmt.Printf("Error formatting %s: %v\n", path, err)
			return nil
		}

		// Write the changes back to the file
		err = os.WriteFile(path, buf.Bytes(), 0644)
		if err != nil {
			fmt.Printf("Error writing %s: %v\n", path, err)
			return nil
		}

		fmt.Printf("Updated %s\n", path)
		return nil
	})

	if err != nil {
		fmt.Printf("Error walking directory: %v\n", err)
		os.Exit(1)
	}
}