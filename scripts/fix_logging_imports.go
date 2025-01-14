package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	projectRoot := "/workspaces/new-api"

	// Files that have unused imports to remove
	unusedImports := map[string]string{
		"middleware/recover.go":                      `"one-api/common"`,
		"relay/channel/cloudflare/relay_cloudflare.go": `"one-api/common"`,
		"relay/channel/ali/image.go":                 `"one-api/common"`,
	}

	// Walk through all .go files in the project
	err := filepath.Walk(projectRoot, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip vendor directory if it exists
		if info.IsDir() && info.Name() == "vendor" {
			return filepath.SkipDir
		}

		// Only process .go files
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".go") {
			// Get relative path for logging
			relPath, err := filepath.Rel(projectRoot, path)
			if err != nil {
				fmt.Printf("Error getting relative path for %s: %v\n", path, err)
				return nil
			}

			// Read the file
			content, err := os.ReadFile(path)
			if err != nil {
				fmt.Printf("Error reading file %s: %v\n", relPath, err)
				return nil
			}

			contentStr := string(content)

			// Skip if file doesn't contain "logging." references
			if !strings.Contains(contentStr, "logging.") {
				return nil
			}

			// Skip if logging import already exists
			if strings.Contains(contentStr, `"one-api/logging"`) {
				fmt.Printf("Logging import already exists in %s\n", relPath)
				return nil
			}

			// Find the import block
			importStart := strings.Index(contentStr, "import (")
			importEnd := strings.Index(contentStr, ")")
			if importStart == -1 || importEnd == -1 {
				fmt.Printf("Could not find import block in %s\n", relPath)
				return nil
			}

			// Add logging import
			importBlock := contentStr[importStart:importEnd]
			newImportBlock := importBlock + "\n\t\"one-api/logging\""
			newContent := contentStr[:importStart] + newImportBlock + contentStr[importEnd:]

			// Write the modified content back to the file
			err = os.WriteFile(path, []byte(newContent), 0644)
			if err != nil {
				fmt.Printf("Error writing file %s: %v\n", relPath, err)
				return nil
			}

			fmt.Printf("Successfully added logging import to %s\n", relPath)
		}
		return nil
	})

	if err != nil {
		fmt.Printf("Error walking through project: %v\n", err)
		os.Exit(1)
	}

	// Remove unused imports
	for file, importToRemove := range unusedImports {
		fullPath := filepath.Join(projectRoot, file)
		
		// Read the file
		content, err := os.ReadFile(fullPath)
		if err != nil {
			fmt.Printf("Error reading file %s: %v\n", file, err)
			continue
		}

		contentStr := string(content)

		// Find the import block
		importStart := strings.Index(contentStr, "import (")
		importEnd := strings.Index(contentStr, ")")
		if importStart == -1 || importEnd == -1 {
			fmt.Printf("Could not find import block in %s\n", file)
			continue
		}

		// Remove unused import
		importBlock := contentStr[importStart:importEnd]
		lines := strings.Split(importBlock, "\n")
		var newLines []string
		for _, line := range lines {
			if !strings.Contains(line, importToRemove) {
				newLines = append(newLines, line)
			}
		}
		newImportBlock := strings.Join(newLines, "\n")
		newContent := contentStr[:importStart] + newImportBlock + contentStr[importEnd:]

		// Write the modified content back to the file
		err = os.WriteFile(fullPath, []byte(newContent), 0644)
		if err != nil {
			fmt.Printf("Error writing file %s: %v\n", file, err)
			continue
		}

		fmt.Printf("Successfully removed unused import from %s\n", file)
	}
}