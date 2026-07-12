import { CommonRepository } from "./common.repository.js";

export class CommonService {
  constructor(private readonly repository = new CommonRepository()) {}

  listAreas() {
    return this.repository.listRegisteredAreas();
  }
}
