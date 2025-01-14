package common

import (
	"fmt"
	"one-api/logging"
)

func SysLog(s string) {
	logging.SysLog(s)
}

func SysError(s string) {
	logging.SysError(s)
}

func FatalLog(v ...any) {
	logging.FatalLog(v...)
}

func LogQuota(quota int) string {
	if DisplayInCurrencyEnabled {
		return fmt.Sprintf("$%.6f credits", float64(quota)/QuotaPerUnit)
	} else {
		return fmt.Sprintf("%d credits", quota)
	}
}
