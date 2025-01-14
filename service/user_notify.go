package service

import (
	"fmt"
	"one-api/common"
	"one-api/model"

	"one-api/logging")

func notifyRootUser(subject string, content string) {
	if common.RootUserEmail == "" {
		common.RootUserEmail = model.GetRootUserEmail()
	}
	err := common.SendEmail(subject, common.RootUserEmail, content)
	if err != nil {
		logging.SysError(fmt.Sprintf("failed to send email: %s", err.Error()))
	}
}
