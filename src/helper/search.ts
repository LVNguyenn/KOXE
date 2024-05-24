
const search = async ({ data, keyword, fieldname }:
    { data: any, keyword?: string, fieldname: string }) => {

    try {
        return data.filter(function (obj: any) {
            let fieldValue = obj[fieldname].toLowerCase();
            let lowerKeyword = keyword?.toLowerCase();
            return fieldValue.includes(lowerKeyword);
        });
    } catch (error) {
        return null;
    }
}

export default search;
