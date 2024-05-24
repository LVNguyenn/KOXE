
const search = async ({ data, keyword, fieldname }:
    { data: any, keyword?: string, fieldname: string }) => {

    try {
        return data.filter(function (obj: any) {
            return obj[fieldname].includes(keyword);
        });
    } catch (error) {
        return null;
    }
}

export default search;
