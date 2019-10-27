const fs = require("fs")
const path = require("path")

module.exports = {
  // newCaseNumber(msg, serverInfo)
  // Returns the next case number on a per-server basis.
  // Also increments the counter.
  newCaseNumber(msg, serverInfo){
    let caseNumber = serverInfo.caseNumber
    caseNumber = caseNumber + 1
    return caseNumber
  }

}
