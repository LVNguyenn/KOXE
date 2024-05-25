
const pagination = async ({ data, page = 1, per_page = 4 }:
    { data: any, page?: number, per_page?: number }) => {

    let rs = { total_page: 1, data: null };

    try {
        if (!data) return null;
        if (typeof data === "object") rs.total_page = Math.ceil(data.length / per_page);
        rs.data = data.slice((page - 1) * per_page, page * per_page);
    } catch (error) { }

    return rs;
}

export default pagination;
